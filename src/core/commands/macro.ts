import { Frame, hex, isValueOf, le16Bytes, unpackLe32 } from "../bytes";
import { TransportError } from "../errors";
import { assertRange, type Bus, Op } from "./shared";

export const MacroLoop = {
  untilReleased: 0,
  untilClick: 1,
  times: 2,
} as const;

export type MacroLoop = (typeof MacroLoop)[keyof typeof MacroLoop];

export type MacroEvent =
  | { type: "down"; usage: number }
  | { type: "up"; usage: number }
  | { type: "delay"; ms: number };

export interface Macro {
  name: string;
  loop: MacroLoop;
  repeats: number;
  events: MacroEvent[];
}

export const MACRO_BLOB_LENGTH = 320;

const Offset = {
  loop: 1,
  repeats: 2,
  slots: 4,
  name: 0x120,
  size: 0x130,
  signature: 0x134,
  id: 0x138,
  eventCount: 0x13c,
  slotCount: 0x13e,
} as const;

const SLOT_LENGTH = 4;
const slotOffset = (i: number) => Offset.slots + i * SLOT_LENGTH;

export const MAX_MACRO_SLOTS = (Offset.name - Offset.slots) / SLOT_LENGTH;

const NAME_FIELD_LENGTH = 16;
/** The field is NUL terminated. */
export const MAX_MACRO_NAME_BYTES = NAME_FIELD_LENGTH - 1;

const RECORD_HEADER_SIZE = 0x6c;
const RECORD_SIGNATURE = 0xe8e80010;

export const MAX_MACRO_REPEATS = 0xfffd;
export const MAX_MACRO_DELAY_MS = 0xffff;

/** A key opens a slot and the delay that follows it closes the same slot. */
interface Slot {
  flags: number;
  usage: number;
  ms: number;
}

const SlotFlag = {
  explicitDelay: 0x01,
  implicitDelay: 0x02,
  leadingDelay: 0x04,
  keyUp: 0x80,
} as const;

/** Gap the vendor app inserts between two key events that have no delay between them. */
export const IMPLICIT_GAP_MS = 10;
const TRAILING_KEY_UP_DELAY = 8;

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const isMacroLoop = isValueOf(MacroLoop);

/**
 * The vendor app tells library entries apart by this id, so derive it from the content.
 * The buffer id byte is skipped so the same macro gets the same id in every buffer.
 */
function fnv1a(bytes: Uint8Array): number {
  let h = 0x811c9dc5;

  for (const b of bytes) {
    h = Math.imul(h ^ b, 0x01000193);
  }

  return h >>> 0;
}

function assertEvent(event: MacroEvent): void {
  if (event.type === "delay") {
    assertRange("delay", event.ms, 0, MAX_MACRO_DELAY_MS);
  } else {
    // Usage 0 marks a slot with no key, so a real key must be at least 1
    assertRange("usage", event.usage, 1, 0xff);
  }
}

interface PackedSlots {
  slots: Slot[];
  /** Where the vendor app's slot cursor ends up: on the last slot if it is still open, else past it. */
  slotCount: number;
}

function packSlots(events: MacroEvent[]): PackedSlots {
  const slots: Slot[] = [];
  let open: Slot | null = null;

  for (const [i, event] of events.entries()) {
    if (event.type === "delay") {
      if (open) {
        open.flags |= SlotFlag.explicitDelay;
        open.ms = event.ms;
      } else {
        slots.push({
          flags: i === 0 ? SlotFlag.leadingDelay : SlotFlag.explicitDelay,
          usage: 0,
          ms: event.ms,
        });
      }

      open = null;
      continue;
    }

    if (open) {
      open.flags |= SlotFlag.implicitDelay;
      open.ms = IMPLICIT_GAP_MS;
    }

    open =
      event.type === "up"
        ? { flags: SlotFlag.keyUp, usage: event.usage, ms: TRAILING_KEY_UP_DELAY }
        : { flags: 0, usage: event.usage, ms: 0 };
    slots.push(open);
  }

  return { slots, slotCount: slots.length + (open ? 0 : 1) };
}

const DELAY_FLAGS = SlotFlag.explicitDelay | SlotFlag.leadingDelay;

function unpackSlots(slots: Slot[]): MacroEvent[] {
  return slots.flatMap((slot): MacroEvent[] => {
    if (slot.usage === 0) {
      return slot.flags & DELAY_FLAGS ? [{ type: "delay", ms: slot.ms }] : [];
    }

    const key: MacroEvent = {
      type: slot.flags & SlotFlag.keyUp ? "up" : "down",
      usage: slot.usage,
    };
    const closedByDelay = (slot.flags & ~SlotFlag.keyUp) === SlotFlag.explicitDelay;

    return closedByDelay ? [key, { type: "delay", ms: slot.ms }] : [key];
  });
}

export function encodeMacro(bufferId: number, macro: Macro): Uint8Array {
  assertRange("bufferId", bufferId, 0, 0xff);
  assertRange("repeats", macro.repeats, 0, MAX_MACRO_REPEATS);
  macro.events.forEach(assertEvent);

  const name = encoder.encode(macro.name);

  if (name.length > MAX_MACRO_NAME_BYTES) {
    throw new RangeError(`name must be at most ${MAX_MACRO_NAME_BYTES} bytes`);
  }

  const { slots, slotCount } = packSlots(macro.events);

  if (slotCount > MAX_MACRO_SLOTS) {
    throw new RangeError(`events need ${slotCount} slots, at most ${MAX_MACRO_SLOTS} fit`);
  }

  // The vendor app counts one event even for an empty macro
  const eventCount = Math.max(macro.events.length, 1);

  const blob = new Uint8Array(MACRO_BLOB_LENGTH);
  blob[0] = bufferId;
  blob[Offset.loop] = macro.loop;
  blob.set(le16Bytes(macro.repeats), Offset.repeats);

  slots.forEach((slot, i) => {
    blob.set([slot.flags, slot.usage, ...le16Bytes(slot.ms)], slotOffset(i));
  });

  blob.set(name, Offset.name);
  blob.set(unpackLe32(RECORD_HEADER_SIZE + eventCount * 4), Offset.size);
  blob.set(unpackLe32(RECORD_SIGNATURE), Offset.signature);
  blob.set(unpackLe32(fnv1a(blob.subarray(Offset.loop, Offset.size))), Offset.id);
  blob.set(le16Bytes(eventCount), Offset.eventCount);
  blob.set(le16Bytes(slotCount), Offset.slotCount);

  return blob;
}

function decodeName(f: Frame): string {
  const field = f.bytes(Offset.name, NAME_FIELD_LENGTH);
  const end = field.indexOf(0);
  return decoder.decode(end === -1 ? field : field.subarray(0, end));
}

/** Returns null for a slot the device has never been given a macro for. */
export function decodeMacro(blob: Uint8Array): Macro | null {
  const f = new Frame(blob);

  if (f.le32(Offset.size) === 0) {
    return null;
  }

  const loop = f.u8(Offset.loop);

  if (!isMacroLoop(loop)) {
    throw new TransportError(`Unknown macro loop type ${hex(loop)}`);
  }

  const slotCount = Math.min(f.le16(Offset.slotCount), MAX_MACRO_SLOTS);
  const slots = Array.from({ length: slotCount }, (_, i): Slot => {
    const at = slotOffset(i);
    return { flags: f.u8(at), usage: f.u8(at + 1), ms: f.le16(at + 2) };
  });

  return {
    name: decodeName(f),
    loop,
    repeats: f.le16(Offset.repeats),
    events: unpackSlots(slots),
  };
}

const CHUNK_LENGTH = 32;
const CHUNK_COUNT = MACRO_BLOB_LENGTH / CHUNK_LENGTH;
const chunkArgs = (chunk: number, bufferId: number) => [CHUNK_COUNT, chunk, CHUNK_LENGTH, bufferId];

export async function readMacro(t: Bus, bufferId: number): Promise<Macro | null> {
  assertRange("bufferId", bufferId, 0, 0xff);
  const blob = new Uint8Array(MACRO_BLOB_LENGTH);

  for (let chunk = 0; chunk < CHUNK_COUNT; chunk++) {
    const r = await t.readBlock(Op.macro, chunkArgs(chunk, bufferId));
    blob.set(r.bytes(0, CHUNK_LENGTH), chunk * CHUNK_LENGTH);
  }

  return decodeMacro(blob);
}

export async function writeMacro(t: Bus, bufferId: number, macro: Macro): Promise<void> {
  const blob = encodeMacro(bufferId, macro);

  for (let chunk = 0; chunk < CHUNK_COUNT; chunk++) {
    const start = chunk * CHUNK_LENGTH;
    await t.writeBlock(
      Op.macro,
      chunkArgs(chunk, bufferId),
      blob.subarray(start, start + CHUNK_LENGTH),
    );
  }
}
