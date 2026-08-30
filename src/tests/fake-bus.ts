import { Frame } from "@/core/bytes";
import type { Bus } from "@/core/commands";

export interface Call {
  op: number;
  args: number[];
}

export type Responder = (op: number, args: number[]) => number[];

export function fakeBus(respond: Responder = () => [], wireless = false) {
  const writes: Call[] = [];
  const reads: Call[] = [];

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
  };

  return { bus, writes, reads };
}
