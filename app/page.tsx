"use client";

import { DigestCard } from "@/components/DigestCard";
import { format } from "date-fns";
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

export default function Home() {
  const [items, setItems] = useState<DigestItem[]>([]);
  const [date, setDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDigest() {
      try {
        const res = await fetch("/api/digest/latest");
        const data = await res.json();
        setItems(data.items || []);
        setDate(data.date);
      } catch (error) {
        console.error("Failed to fetch digest", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDigest();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-neutral-900 dark:border-neutral-100"></div>
      </div>
    );
  }

  if (!date || items.length === 0) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
          No digest available yet.
        </h2>
        <p className="text-neutral-500 dark:text-neutral-300 mt-2">
          Check back later or ensure the cron job has run.
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-8 lg:px-16 py-16">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
          Bixby Digest for {format(new Date(date), "MMMM do, yyyy")}
        </h1>
        <p className="text-neutral-500 dark:text-neutral-300 mt-2">
          Good morning, Jason. Here are your top updates.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <DigestCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
