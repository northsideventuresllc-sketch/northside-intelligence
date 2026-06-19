import type { Metadata } from "next";
import { AccountTypeSection } from "@/components/account/sections/AccountTypeSection";
import { getAccountPageData } from "@/lib/account/get-account-page-data";

export const metadata: Metadata = {
  title: "Account Type | Northside Intelligence",
};

export default async function AccountTypePage() {
  const data = await getAccountPageData();
  if (!data) return null;

  return <AccountTypeSection initialProfile={data.initialProfile} />;
}
