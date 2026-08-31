import createMDX from "@next/mdx";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // `.mdx` alongside the TypeScript entry points. Blog posts are imported
  // rather than routed, so nothing is served from an `.mdx` file directly, but
  // the loader is only wired up for extensions named here.
  pageExtensions: ["ts", "tsx", "mdx"],
};

/**
 * No remark or rehype plugins, deliberately.
 *
 * Turbopack compiles MDX in Rust and cannot receive a JavaScript function, so
 * a plugin has to be named as a string and take serializable options only.
 * Frontmatter would need one; an exported `meta` const needs none, which is
 * why posts carry their metadata that way.
 */
const withMDX = createMDX({});

export default withMDX(nextConfig);
