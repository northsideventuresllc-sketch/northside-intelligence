export const metadata = {
  title: "NI Ops | Northside Intelligence",
  robots: { index: false, follow: false },
};

export default function OpsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
