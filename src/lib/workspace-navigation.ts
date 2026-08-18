export type UserMenuItem = {
  label: string;
  href: "/dashboard" | "/organisations" | "/account" | "/operations";
  requiresVerifiedAccount?: boolean;
};

export const userMenuItems = [
  {
    label: "Overview",
    href: "/dashboard",
  },
  {
    label: "Organisations",
    href: "/organisations",
    requiresVerifiedAccount: true,
  },
  {
    label: "Account & Security",
    href: "/account",
  },
] as const satisfies readonly UserMenuItem[];

/**
 * The operator's own entry, appended only for someone holding `trust_ops`.
 *
 * Hiding it is presentation, not a control: the page redirects and the registry
 * answers 403 to both console routes regardless of what the menu shows. What
 * this avoids is offering every ordinary member a door that only refuses them.
 */
const operationsItem = {
  label: "Trust operations",
  href: "/operations",
} as const satisfies UserMenuItem;

export function menuItemsFor(isOperator: boolean): readonly UserMenuItem[] {
  return isOperator ? [...userMenuItems, operationsItem] : userMenuItems;
}
