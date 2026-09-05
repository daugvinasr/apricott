import { compile } from "@inlang/paraglide-js";

export const PARAGLIDE_PROJECT_PATH = "./project.inlang";
export const PARAGLIDE_OUTDIR_PATH = "./src/paraglide";

await Promise.all([
  compile({
    project: PARAGLIDE_PROJECT_PATH,
    outdir: PARAGLIDE_OUTDIR_PATH,
  }),
]);
