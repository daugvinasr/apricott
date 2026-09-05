import { Banner } from "@astryxdesign/core/Banner";

export default function SettingError({ error }: { error: Error | null }) {
  if (!error) {
    return null;
  }

  return <Banner status="error" title={error.message} />;
}
