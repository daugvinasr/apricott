import { Frame } from "@/core/bytes";
import type { Bus } from "@/core/commands";

export interface Call {
  op: number;
  args: number[];
}

export interface BlockCall extends Call {
  data: number[];
}

export type Responder = (op: number, args: number[]) => number[];

export function fakeBus(respond: Responder = () => [], wireless = false) {
  const writes: Call[] = [];
  const reads: Call[] = [];
  const blockWrites: BlockCall[] = [];
  const blockReads: Call[] = [];

  const bus: Bus = {
    wireless,
    write: async (op: number, args?: number[]) => {
      writes.push({ op, args: args ?? [] });
    },
    read: async (op: number, args?: number[]) => {
      const a = args ?? [];
      reads.push({ op, args: a });
      return new Frame(Uint8Array.from(respond(op, a)));
    },
    writeBlock: async (op: number, args: number[], data: Uint8Array) => {
      blockWrites.push({ op, args, data: [...data] });
    },
    readBlock: async (op: number, args: number[]) => {
      blockReads.push({ op, args });
      return new Frame(Uint8Array.from(respond(op, args)));
    },
  };

  return { bus, writes, reads, blockWrites, blockReads };
}
