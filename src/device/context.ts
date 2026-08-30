import type { QueryClient } from "@tanstack/react-query";
import { createContext, useContext } from "react";
import type { Identity } from "@/core/commands";
import type { Transport } from "@/core/transport";
import type { InputReportStore } from "./inputReports";

export interface Device {
  transport: Transport;
  identity: Identity;
  queries: QueryClient; // settings cache, scoped to this connection
  inputReports: InputReportStore;
}

export interface Connection {
  device: Device | null;
  connect: () => Promise<void>;
}

export const ConnectionContext = createContext<Connection | null>(null);
export const DeviceContext = createContext<Device | null>(null);

export function useConnection(): Connection {
  const ctx = useContext(ConnectionContext);

  if (!ctx) {
    throw new Error("useConnection must be used inside <DeviceProvider>");
  }

  return ctx;
}

export function useConnectedDevice(): Device {
  const device = useContext(DeviceContext);

  if (!device) {
    throw new Error("useConnectedDevice must be used inside <Connected>");
  }

  return device;
}
