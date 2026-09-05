import { Connected, DeviceProvider } from "./device/connection";
import { useConnection } from "./device/context";
import DeviceHero from "./components/DeviceHero";
import DpiPanel from "./components/DpiPanel";
import InputReportPanel from "./components/InputReportPanel";
import Landing from "./components/Landing";
import PollingRatePanel from "./components/PollingRatePanel";
import LiftOffPanel from "./components/LiftOffPanel";
import SleepTimerPanel from "./components/SleepTimerPanel";
import DebouncePanel from "./components/DebouncePanel";
import PerformanceModePanel from "./components/PerformanceModePanel";
import SensorTogglesPanel from "./components/SensorTogglesPanel";
import { Theme } from "@astryxdesign/core/theme";
import { neutralTheme } from "@astryxdesign/theme-neutral/built";
import { Layout, LayoutContent, LayoutPanel } from "@astryxdesign/core/Layout";
import { VStack } from "@astryxdesign/core/Stack";
import { Divider } from "@astryxdesign/core/Divider";
import type { ReactNode } from "react";

function Settings() {
  return (
    <VStack maxWidth={760}>
      <PollingRatePanel />
      <Divider isFullBleed />
      <LiftOffPanel />
      <Divider isFullBleed />
      <PerformanceModePanel />
      <Divider isFullBleed />
      <SleepTimerPanel />
      <Divider isFullBleed />
      <DebouncePanel />
      <Divider isFullBleed />
      <SensorTogglesPanel />
      <Divider isFullBleed />
      <DpiPanel />
    </VStack>
  );
}

function Shell({ start, content }: { start?: ReactNode; content: ReactNode }) {
  return (
    <Layout
      contentWidth={1160}
      padding={6}
      start={start}
      content={<LayoutContent padding={6}>{content}</LayoutContent>}
    />
  );
}

function Configurator() {
  const { device, connect } = useConnection();

  if (!device) {
    return <Shell content={<Landing onConnect={() => connect()} />} />;
  }

  return (
    <Connected>
      <Shell
        start={
          <LayoutPanel width={360} hasDivider label="Device" padding={6}>
            <VStack gap={6}>
              <DeviceHero identity={device.identity} />
              <InputReportPanel />
            </VStack>
          </LayoutPanel>
        }
        content={<Settings />}
      />
    </Connected>
  );
}

function App() {
  return (
    <Theme theme={neutralTheme}>
      <DeviceProvider>
        <Configurator />
      </DeviceProvider>
    </Theme>
  );
}

export default App;
