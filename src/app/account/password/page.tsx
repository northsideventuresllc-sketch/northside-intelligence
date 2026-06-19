import type { Metadata } from "next";
import { PasswordSection } from "@/components/account/sections/PasswordSection";

export const metadata: Metadata = {
  title: "Password | Northside Intelligence",
};

export default function AccountPasswordPage() {
  return <PasswordSection />;
}
