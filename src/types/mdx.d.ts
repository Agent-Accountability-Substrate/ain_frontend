/**
 * Narrows the `meta` export every post carries.
 *
 * `@types/mdx` types the default export of an `.mdx` file and leaves every
 * other export untyped, which would make `meta` an implicit `any` that flows
 * into the registry unchecked. Declared as `unknown` instead, so the only way
 * to read it is to parse it, which is what `blog-content.ts` does.
 *
 * Deliberately not a module: a top-level `import` or `export` here would scope
 * the declaration to this file instead of augmenting every `.mdx` import.
 */
declare module "*.mdx" {
  export const meta: unknown;
}
