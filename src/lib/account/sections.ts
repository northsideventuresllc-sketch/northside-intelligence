export interface AccountSection {
  id: string;
  label: string;
  href: string;
  description: string;
}

export const ACCOUNT_SECTIONS: AccountSection[] = [
  {
    id: "account-type",
    label: "Account Type",
    href: "/account/account-type",
    description: "Personal or business account settings",
  },
  {
    id: "profile",
    label: "Profile Settings",
    href: "/account/profile",
    description: "Name, username, and email",
  },
  {
    id: "password",
    label: "Password",
    href: "/account/password",
    description: "Update your sign-in password",
  },
  {
    id: "security",
    label: "Two-Factor Auth",
    href: "/account/security",
    description: "Email verification on sign-in",
  },
  {
    id: "billing",
    label: "Billing",
    href: "/account/billing",
    description: "Plans, upgrades, and subscriptions",
  },
  {
    id: "notifications",
    label: "Notifications",
    href: "/account/notifications",
    description: "In-app and email notification preferences",
  },
];

export function getAccountSection(id: string): AccountSection | undefined {
  return ACCOUNT_SECTIONS.find((section) => section.id === id);
}
