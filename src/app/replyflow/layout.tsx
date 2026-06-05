import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ReplyFlow — AI Customer Service Replies",
  description: "Generate professional customer service responses in seconds with AI.",
};

export default function ReplyFlowLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="replyflow-root min-h-screen bg-rf-bg text-white antialiased">{children}</div>
  );
}
