import { Star } from "lucide-react";

export function RatingItem({ stars, count }: { stars: number; count: number }) {
  return (
    <div className="flex items-center gap-2 bg-[#2B2B2B] rounded-lg px-3 py-2">
      <div className="flex">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={16}
            className={
              i < stars
                ? "text-[#8451E1] fill-[#8451E1]"
                : "text-[#8451E1] stroke-[#8451E1]"
            }
          />
        ))}
      </div>
      <p className="text-[#ACACAC] text-sm">{count}</p>
    </div>
  );
}
