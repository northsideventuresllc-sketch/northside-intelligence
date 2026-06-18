import type { Metadata } from "next";
import { SecuritySection } from "@/components/account/sections/SecuritySection";
import { getAccountPageData } from "@/lib/account/get-account-page-data";

export const metadata: Metadata = {
  title: "Two-Factor Auth | Northside Intelligence",
};

export default async function AccountSecurityPage() {
  const data = await getAccountPageData();
  if (!data) return null;

  return <SecuritySection initialProfile={data.initialProfile} />;
}
