"use client";

import { DigestCard } from "@/components/DigestCard";
import { format, toZonedTime } from "date-fns-tz";
import { Filter } from "lucide-react";
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

const CATEGORIES = [
  { id: "f1", label: "F1", color: "red" },
  { id: "dev_tools", label: "Dev Tools", color: "neutral" },
  { id: "ml_news", label: "ML News", color: "purple" },
  { id: "productivity", label: "Productivity", color: "green" },
  { id: "misc", label: "Misc", color: "gray" },
];

export default function Home() {
  const [items, setItems] = useState<DigestItem[]>([]);
  const [date, setDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Load saved category preferences from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("selectedCategories");
    if (saved) {
      setSelectedCategories(JSON.parse(saved));
    } else {
      // Default: all categories enabled
      setSelectedCategories(CATEGORIES.map((c) => c.id));
    }
  }, []);

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

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) => {
      const newSelection = prev.includes(categoryId)
        ? prev.filter((c) => c !== categoryId)
        : [...prev, categoryId];
      localStorage.setItem("selectedCategories", JSON.stringify(newSelection));
      return newSelection;
    });
  };

  const filteredItems = items.filter((item) =>
    selectedCategories.includes(item.category)
  );

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
          Bixby Digest for {format(toZonedTime(new Date(date), "Asia/Kolkata"), "MMMM do, yyyy")}
        </h1>
        <p className="text-neutral-500 dark:text-neutral-300 mt-2">
          Good morning, Jason. Here are your top updates.
        </p>
      </header>

      {/* Category Filters */}
      <div className="mb-6 p-4 bg-neutral-100 dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
            <Filter className="w-4 h-4" />
            <span>Filter:</span>
          </div>
          {CATEGORIES.map((category) => (
            <button
              key={category.id}
              onClick={() => toggleCategory(category.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                selectedCategories.includes(category.id)
                  ? "bg-blue-500 text-white border-blue-600 shadow-sm"
                  : "bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-300 dark:border-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-700"
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>
        <div className="mt-3 text-xs text-neutral-500 dark:text-neutral-400">
          Showing {filteredItems.length} of {items.length} articles
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => (
          <DigestCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
