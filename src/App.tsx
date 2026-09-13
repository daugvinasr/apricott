import { m } from "@/paraglide/messages";
import type { ButtonName } from "@/core/commands";
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
import ResetDefaultsButton from "./components/ResetDefaultsButton";
import ButtonsPanel from "./components/ButtonsPanel";
import { Theme } from "@astryxdesign/core/theme";
import { neutralTheme } from "@astryxdesign/theme-neutral/built";
import { Layout, LayoutContent, LayoutHeader, LayoutPanel } from "@astryxdesign/core/Layout";
import { HStack, VStack } from "@astryxdesign/core/Stack";
import { Button } from "@astryxdesign/core/Button";
import { Icon } from "@astryxdesign/core/Icon";
import GitHubIcon from "./components/GitHubIcon";
import { Divider } from "@astryxdesign/core/Divider";
import { Tab, TabList } from "@astryxdesign/core/TabList";
import { type ReactNode, useState } from "react";
import * as stylex from "@stylexjs/stylex";

const VIEWS = ["settings", "dpi", "buttons"] as const;
type View = (typeof VIEWS)[number];

function isView(value: string): value is View {
  return VIEWS.some((view) => view === value);
}

const styles = stylex.create({
  tabActions: { marginInlineStart: "auto" },
});

function Settings() {
  return (
    <VStack paddingBlockStart={6}>
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
    </VStack>
  );
}

function Header() {
  return (
    <LayoutHeader height={48}>
      <HStack justify="end" align="center" height="100%">
        <Button
          label={m.github()}
          icon={<Icon icon={GitHubIcon} size="sm" />}
          isIconOnly
          variant="ghost"
          href="https://github.com/daugvinasr/apricott"
          target="_blank"
        />
      </HStack>
    </LayoutHeader>
  );
}

function Shell({ start, content }: { start?: ReactNode; content: ReactNode }) {
  return (
    <Layout
      header={<Header />}
      contentWidth={1160}
      padding={6}
      start={start}
      content={<LayoutContent padding={6}>{content}</LayoutContent>}
    />
  );
}

function Tabbed({
  view,
  onChange,
  children,
}: {
  view: View;
  onChange: (view: View) => void;
  children: ReactNode;
}) {
  return (
    <VStack maxWidth={760}>
      <TabList
        value={view}
        onChange={(value) => {
          if (isView(value)) onChange(value);
        }}
        hasDivider
      >
        <Tab value="settings" label={m.settings()} />
        <Tab value="dpi" label={m.dpi()} />
        <Tab value="buttons" label={m.buttons()} />
        <HStack xstyle={styles.tabActions} align="center">
          <ResetDefaultsButton />
        </HStack>
      </TabList>
      {children}
    </VStack>
  );
}

function Configurator() {
  const { device, connect } = useConnection();
  const [view, setView] = useState<View>("settings");
  const [hoveredButton, setHoveredButton] = useState<ButtonName>();

  if (!device) {
    return <Shell content={<Landing onConnect={connect} />} />;
  }

  const isButtonsView = view === "buttons";

  const changeView = (next: View) => {
    setView(next);
    setHoveredButton(undefined);
  };

  return (
    <Connected>
      <Shell
        start={
          <LayoutPanel width={360} hasDivider label={m.device()} padding={6}>
            <VStack gap={6}>
              <DeviceHero
                identity={device.identity}
                showButtons={isButtonsView}
                highlightedButton={hoveredButton}
              />
              <InputReportPanel />
            </VStack>
          </LayoutPanel>
        }
        content={
          <Tabbed view={view} onChange={changeView}>
            {view === "settings" && <Settings />}
            {view === "dpi" && <DpiPanel />}
            {isButtonsView && <ButtonsPanel onHover={setHoveredButton} />}
          </Tabbed>
        }
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
