import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ReplyFlow — AI Customer Service Replies",
  description: "Generate professional customer service responses in seconds with AI.",
  icons: {
    icon: [
      { url: "/replyflow/icon.svg", type: "image/svg+xml" },
      { url: "/logos/replyflow.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/logos/replyflow.svg", type: "image/svg+xml" }],
  },
};

export default function ReplyFlowLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="replyflow-root min-h-screen bg-rf-bg text-white antialiased">{children}</div>
  );
}
