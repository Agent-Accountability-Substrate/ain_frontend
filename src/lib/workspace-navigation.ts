export type UserMenuItem = {
  label: string;
  href: "/dashboard" | "/organisations" | "/account";
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
