import type { Metadata } from "next";
import { BillingSection } from "@/components/account/sections/BillingSection";
import { getAccountPageData } from "@/lib/account/get-account-page-data";

export const metadata: Metadata = {
  title: "Billing | Northside Intelligence",
};

export default async function AccountBillingPage() {
  const data = await getAccountPageData();
  if (!data) return null;

  return <BillingSection billing={data.billing} />;
}
