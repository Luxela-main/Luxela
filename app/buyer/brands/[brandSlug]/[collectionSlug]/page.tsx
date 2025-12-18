import { ChevronRight } from "lucide-react";
import Link from "next/link";
import CollectionClient from "./CollectionClient";

interface PageProps {
  params: {
    brandSlug: string;
    collectionSlug: string;
  };
}

export default function CollectionPage({ params }: PageProps) {
  const { brandSlug, collectionSlug } = params;

  return (
    <main className="px-6">
      {/* Breadcrumb Header */}
      <header>
        <div className="w-fit flex items-center gap-2 my-10 text-sm text-[#858585]">
          <Link
            href="/buyer/brands"
            className="hover:text-[#DCDCDC] capitalize"
          >
            Brands
          </Link>
          <ChevronRight size={16} />
          <Link
            href={`/buyer/brands/${brandSlug}`}
            className="hover:text-[#DCDCDC] capitalize"
          >
            {brandSlug}
          </Link>
          <ChevronRight size={16} />
          <span className="text-[#DCDCDC] capitalize">
            {collectionSlug}
          </span>
        </div>
      </header>

      {/* Client-side collection UI */}
      <CollectionClient />
    </main>
  );
}
