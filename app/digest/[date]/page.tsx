"use client";

import { DigestCard } from "@/components/DigestCard";
import { format } from "date-fns";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

interface DigestItem {
  id: string;
  title: string;
  summary: string;
  source_url: string;
  source_name: string;
  category: string;
  is_favorited: boolean;
  date: string;
}

export default function ArchiveDatePage() {
  const params = useParams();
  const date = params.date as string;

  const [items, setItems] = useState<DigestItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDigest() {
      try {
        const res = await fetch(`/api/digest/${date}`);
        const data = await res.json();
        // API returns array directly, not { items: [] }
        setItems(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to fetch digest", error);
      } finally {
        setLoading(false);
      }
    }

    if (date) {
      fetchDigest();
    }
  }, [date]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black dark:border-gray-200"></div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          No digest found for {date}.
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Try selecting a different date.
        </p>
      </div>
    );
  }

  const officialItems = items.filter((item) => item.category === "official_news");
  const otherItems = items.filter((item) => item.category !== "official_news");

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Digest for {format(new Date(date), "MMMM do, yyyy")}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Archive view.</p>
      </header>

      {officialItems.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-gray-200 border-b pb-2 border-gray-200 dark:border-gray-700">
            Official Updates
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {officialItems.map((item) => (
              <DigestCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      )}

      {otherItems.length > 0 && (
        <div>
           {officialItems.length > 0 && (
            <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-gray-200 border-b pb-2 border-gray-200 dark:border-gray-700">
              Curated For You
            </h2>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {otherItems.map((item) => (
              <DigestCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
