import { useIsFetching, useIsMutating, useMutation, useQuery } from "@tanstack/react-query";
import { useConnectedDevice } from "./context";
import type { Bus } from "../core/commands";

export interface DeviceSetting<T> {
  key: string;
  read(bus: Bus): Promise<T>;
  write(bus: Bus, value: T): Promise<void>;
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

export function useDeviceSetting<T>(setting: DeviceSetting<T>) {
  const { transport, queries } = useConnectedDevice();
  const queryKey = [setting.key];

  const query = useQuery({ queryKey, queryFn: () => setting.read(transport) });

  const mutation = useMutation({
    mutationFn: async (next: T) => {
      await setting.write(transport, next);
      const value = await setting.read(transport);

      queries.setQueryData(queryKey, value);

      if (!Object.is(value, next)) {
        throw new ReadbackMismatchError(setting.key, next, value);
      }
    },
  });

  return {
    value: query.data,
    pending: mutation.isPending ? mutation.variables : undefined,
    error: mutation.error ?? query.error,
    set: mutation.mutate,
  };
}

export function useDeviceBusy(): boolean {
  const fetching = useIsFetching();
  const mutating = useIsMutating();
  return fetching + mutating > 0;
}
