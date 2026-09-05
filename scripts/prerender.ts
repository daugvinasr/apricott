import { fileURLToPath } from "node:url";
import type { Plugin } from "vite-plus";

const SERVER_ENTRY = fileURLToPath(new URL("../src/entry-server.tsx", import.meta.url));
const SERVER_OUTDIR = new URL("../node_modules/.tmp/prerender/", import.meta.url);
const SERVER_BUNDLE = new URL("entry-server.js", SERVER_OUTDIR);
const APP_HTML_PLACEHOLDER = "<!--app-html-->";

interface ServerEntry {
  render: () => string;
}

export function prerender(): Plugin {
  return {
    name: "prerender",
    config: () => ({
      environments: {
        ssr: {
          build: {
            outDir: fileURLToPath(SERVER_OUTDIR),
            copyPublicDir: false,
            rolldownOptions: { input: SERVER_ENTRY },
          },
        },
      },
      builder: {
        async buildApp(builder) {
          await builder.build(builder.environments.ssr!);
          await builder.build(builder.environments.client!);
        },
      },
    }),
    async transformIndexHtml(html, { server }) {
      const { render }: ServerEntry = server
        ? await server.ssrLoadModule(SERVER_ENTRY)
        : await import(SERVER_BUNDLE.href);

      return html.replace(APP_HTML_PLACEHOLDER, render());
    },
  };
}
