import { readdirSync } from "node:fs";
import { join } from "node:path";

/** A file under `src/app`, with the URL path of the segment it sits in. */
export interface AppFile {
  /** The file's own name — `route.ts`, `opengraph-image.tsx`, `favicon.ico`. */
  readonly name: string;
  /** The segment's URL path. `/` at the app root, never with a trailing slash. */
  readonly segment: string;
  /**
   * The directory as it sits on disk, `(group)` and `@slot` segments kept.
   *
   * Next hashes this path to disambiguate metadata routes, so the URL a
   * metadata file is served at cannot be derived from `segment` alone.
   */
  readonly dir: string;
}

// Anchored to the project root rather than counted in `../` hops from a test
// file — moving a test between directories should not silently point the scan
// at a directory that does not exist.
const APP_DIR = join(process.cwd(), "src/app");

/**
 * Every file under `src/app`, walked to the leaves.
 *
 * Both guards that read the app directory rather than a list typed out again
 * need the same routing rules, so they live here once: a `(group)` and a
 * `@slot` contribute no URL segment, and a `_private` folder is not routed at
 * all. A dynamic `[segment]` is kept in the path verbatim — skipping it would
 * hide exactly the case a guard exists to catch.
 *
 * `dir` keeps what `segment` drops. A group is transparent to the URL but not
 * to Next's metadata routing, which hashes the parent path to keep two
 * `opengraph-image` files from colliding, so a guard that needs the served URL
 * has to start from the path on disk.
 *
 * Reading only the top level, as both guards used to, meant a route or a
 * metadata file one directory further down was simply not seen.
 */
export function appFiles(): AppFile[] {
  const found: AppFile[] = [];

  const walk = (directory: string, segment: string, dir: string) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (entry.isFile()) {
        found.push({ name: entry.name, segment, dir });
        continue;
      }
      if (entry.name.startsWith("_")) continue;
      const transparent =
        entry.name.startsWith("(") || entry.name.startsWith("@");
      walk(
        join(directory, entry.name),
        transparent
          ? segment
          : `${segment === "/" ? "" : segment}/${entry.name}`,
        `${dir === "/" ? "" : dir}/${entry.name}`,
      );
    }
  };

  walk(APP_DIR, "/", "/");
  return found;
}
