import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { readIdentity } from "@/core/commands";
import { DEVICE_FILTERS, Transport } from "@/core/transport";
import {
  type Connection,
  ConnectionContext,
  type Device,
  DeviceContext,
  useConnection,
} from "./context";
import { wireInputReports } from "./inputReports";

function createDeviceQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: Infinity,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      },
      mutations: { retry: false },
    },
  });
}

async function openDevice(): Promise<Device | null> {
  const devices = await navigator.hid.requestDevice({ filters: DEVICE_FILTERS });

  if (devices.length === 0) {
    return null;
  }

  const transport = await Transport.open(devices);

  try {
    const identity = await readIdentity(transport);
    const queries = createDeviceQueryClient();
    return { transport, identity, queries, inputReports: wireInputReports(transport, queries) };
  } catch (e) {
    await transport.close();
    throw e;
  }
}

async function teardown(device: Device): Promise<void> {
  device.queries.clear();
  await device.transport.close();
}

export function DeviceProvider({ children }: { children: ReactNode }) {
  const [device, setDevice] = useState<Device | null>(null);

  const connection = useMemo<Connection>(
    () => ({
      device,
      async connect() {
        const next = await openDevice();
        if (!next) return;
        setDevice(next);
        if (device) await teardown(device);
      },
    }),
    [device],
  );

  useEffect(() => {
    if (!device) {
      return;
    }

    const onDisconnect = (e: HIDConnectionEvent) => {
      if (e.device === device.transport.device) {
        setDevice(null);
        void teardown(device);
      }
    };

    navigator.hid.addEventListener("disconnect", onDisconnect);

    return () => navigator.hid.removeEventListener("disconnect", onDisconnect);
  }, [device]);

  return <ConnectionContext.Provider value={connection}>{children}</ConnectionContext.Provider>;
}

export function Connected({ children }: { children: ReactNode }) {
  const { device } = useConnection();

  if (!device) {
    return null;
  }

  return (
    <DeviceContext.Provider value={device}>
      <QueryClientProvider client={device.queries}>{children}</QueryClientProvider>
    </DeviceContext.Provider>
  );
}
