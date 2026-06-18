"use client";

interface StarRatingProps {
  rating: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onChange?: (rating: number) => void;
}

const SIZES = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
};

export function StarRating({
  rating,
  max = 5,
  size = "md",
  interactive = false,
  onChange,
}: StarRatingProps) {
  const sizeClass = SIZES[size];

  return (
    <div className="flex items-center gap-0.5" role={interactive ? "radiogroup" : "img"} aria-label={`${rating} out of ${max} stars`}>
      {Array.from({ length: max }, (_, i) => {
        const starValue = i + 1;
        const filled = starValue <= Math.round(rating);

        if (interactive) {
          return (
            <button
              key={starValue}
              type="button"
              role="radio"
              aria-checked={starValue === rating}
              aria-label={`${starValue} star${starValue !== 1 ? "s" : ""}`}
              onClick={() => onChange?.(starValue)}
              onMouseEnter={() => {}}
              className="transition hover:scale-110"
            >
              <StarIcon filled={filled} className={sizeClass} />
            </button>
          );
        }

        return <StarIcon key={starValue} filled={filled} className={sizeClass} />;
      })}
    </div>
  );
}

function StarIcon({ filled, className }: { filled: boolean; className: string }) {
  return (
    <svg
      className={`${className} ${filled ? "text-amber-400" : "text-white/20"}`}
      fill="currentColor"
      viewBox="0 0 20 20"
      aria-hidden
    >
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}
