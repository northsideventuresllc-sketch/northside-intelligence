import { stripInlineMarkdown } from "@/lib/sector3-tools/parse-result";

interface Props {
  text: string;
  className?: string;
}

export function RichText({ text, className = "" }: Props) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);

  return (
    <span className={className}>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={i} className="font-semibold text-white">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}

interface ParagraphProps {
  text: string;
  className?: string;
}

export function RichParagraph({ text, className = "" }: ParagraphProps) {
  return (
    <p className={`leading-relaxed ${className}`}>
      <RichText text={stripInlineMarkdown(text)} />
    </p>
  );
}
