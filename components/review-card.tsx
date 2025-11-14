import { Star, ThumbsDown, ThumbsUp } from "lucide-react";
import Image from "next/image";

type Review = {
  name: string;
  rating: number;
  date: string;
  text: string;
  likes: number;
  dislikes: number;
  images: (string | null)[];
};


export function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Image
          src="/brand-hero-image.jpg"
          width={40}
          height={40}
          alt="Avatar"
          className="object-cover rounded-full size-10"
        />
        <div>
          <p className="text-white font-medium text-sm">{review.name}</p>
          <div className="flex items-center gap-2 text-xs text-[#ACACAC]">
            <span className="flex items-center gap-1">
              {review.rating} <Star size={12} className="text-[#8451E1] fill-[#8451E1]" />
            </span>
            <span>|</span>
            <span>{review.date}</span>
          </div>
        </div>
      </div>

      {/* Review text */}
      <p className="text-[#ACACAC] text-sm leading-relaxed">{review.text}</p>

      {/* Images */}
      {review.images.length > 0 && (
        <div className="flex gap-3">
          {review.images.map((img: string | null, idx: number) =>
            img ? (
              <div
                key={idx}
                className="w-16 h-16 bg-[#2B2B2B] rounded-md flex items-center justify-center"
              >
                <Image
                  src={img}
                  alt={`Review image ${idx + 1}`}
                  width={64}
                  height={64}
                  className="object-cover rounded-md w-full h-full"
                />
              </div>
            ) : null
          )}
        </div>
      )}

      {/* Likes */}
      <div className="flex items-center gap-6 text-xs">
        <div className="flex items-center gap-1 text-green-500">
          <ThumbsUp size={16} /> {review.likes}
        </div>
        <div className="flex items-center gap-1 text-red-500">
          <ThumbsDown size={16} /> {review.dislikes}
        </div>
      </div>
    </div>
  );
}