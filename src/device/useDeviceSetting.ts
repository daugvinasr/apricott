import { useIsFetching, useIsMutating, useMutation, useQuery } from "@tanstack/react-query";
import { useConnectedDevice } from "./context";
import type { Bus } from "@/core/commands";

export interface DeviceSetting<T> {
  key: string;
  read(bus: Bus): Promise<T>;
  write(bus: Bus, value: T): Promise<void>;
  update?: (bus: Bus, next: T, prev: T) => Promise<T>;
  equals?: (a: T, b: T) => boolean;
}

// Should never happen
export class ReadbackMismatchError<T> extends Error {
  constructor(setting: string, written: T, readBack: T) {
    super(
      `${setting}: device reported ${JSON.stringify(readBack)} after writing ${JSON.stringify(written)}`,
    );
    this.name = "ReadbackMismatchError";
  }
}

function useDeviceBusy(): boolean {
  const fetching = useIsFetching();
  const mutating = useIsMutating();
  return fetching + mutating > 0;
}

export function useDeviceSetting<T>(setting: DeviceSetting<T>) {
  const { transport, queries } = useConnectedDevice();
  const busy = useDeviceBusy();
  const queryKey = [setting.key];

  const query = useQuery({ queryKey, queryFn: () => setting.read(transport) });

  const mutation = useMutation({
    mutationFn: async (next: T) => {
      const prev = queries.getQueryData<T>(queryKey);
      let value: T;
      if (setting.update && prev !== undefined) {
        value = await setting.update(transport, next, prev);
      } else {
        await setting.write(transport, next);
        value = await setting.read(transport);
      }

      queries.setQueryData(queryKey, value);

      const equals = setting.equals ?? Object.is;
      if (!equals(value, next)) {
        throw new ReadbackMismatchError(setting.key, next, value);
      }
    },
  });

  return {
    value: query.data,
    shown: mutation.isPending ? mutation.variables : query.data,
    error: mutation.error ?? query.error,
    set: mutation.mutate,
    isDisabled: busy || query.data === undefined,
  };
}
