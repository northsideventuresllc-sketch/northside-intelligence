import type { Metadata } from "next";
import { ProfileSection } from "@/components/account/sections/ProfileSection";
import { getAccountPageData } from "@/lib/account/get-account-page-data";

export const metadata: Metadata = {
  title: "Profile Settings | Northside Intelligence",
};

export default async function AccountProfilePage() {
  const data = await getAccountPageData();
  if (!data) return null;

  return <ProfileSection initialProfile={data.initialProfile} />;
}
