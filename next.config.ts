import createMDX from "@next/mdx";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {/* config options here */};

/**
 * No remark or rehype plugins. Plugin options cross into the bundler as
 * serializable data, so a plugin must be named as a string and take
 * serializable options — frontmatter would need one, an exported `meta` const
 * needs none, which is why posts carry their metadata that way.
 *
 * `pageExtensions` is left at Next's default. The MDX loader is wired from
 * this plugin's `extension` option and never reads that list, and narrowing it
 * would drop `js`/`jsx` from the resolver that finds `proxy`, `middleware` and
 * `instrumentation` — where a missing match is silent.
 */
const withMDX = createMDX({});

export default withMDX(nextConfig);
