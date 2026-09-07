import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { resetToDefaults } from "@/core/commands";
import { useConnectedDevice } from "./context";

export function useResetDefaults() {
  const { transport, identity, queries } = useConnectedDevice();
  const [progress, setProgress] = useState({ done: 0, total: 1 });

  const mutation = useMutation({
    mutationFn: () => {
      setProgress({ done: 0, total: 1 });
      return resetToDefaults(transport, identity.sensor, (done, total) =>
        setProgress({ done, total }),
      );
    },
    onSettled: () => queries.invalidateQueries(),
  });

  return {
    reset: mutation.mutate,
    isPending: mutation.isPending,
    progress,
    error: mutation.error,
  };
}
