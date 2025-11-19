"use client";

import { format } from "date-fns";
import { ExternalLink, Star } from "lucide-react";
import { useState } from "react";

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

interface DigestCardProps {
  item: DigestItem;
}

export function DigestCard({ item: initialItem }: DigestCardProps) {
  const [item, setItem] = useState(initialItem);
  const [isLoading, setIsLoading] = useState(false);

  const toggleFavorite = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/favorites/${item.id}`, { method: "POST" });
      if (res.ok) {
        setItem((prev) => ({ ...prev, is_favorited: !prev.is_favorited }));
      }
    } catch (error) {
      console.error("Failed to toggle favorite", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "f1":
        return "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800";
      case "dev_tools":
        return "bg-neutral-200 dark:bg-neutral-900 text-neutral-800 dark:text-white border-neutral-300 dark:border-neutral-800";
      case "ml_news":
        return "bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 border-purple-200 dark:border-purple-800";
      case "productivity":
        return "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800";
      default:
        return "bg-neutral-100 dark:bg-neutral-900 text-neutral-800 dark:text-white border-neutral-200 dark:border-neutral-800";
    }
  };

  return (
    <div className="bg-neutral-50 dark:bg-neutral-900 border border-transparent rounded-2xl p-6 shadow-none hover:shadow-md transition-all duration-200 flex flex-col h-full group">
      <div className="flex justify-between items-start mb-4">
        <span
          className={`text-xs font-medium px-3 py-1 rounded-lg border ${getCategoryColor(
            item.category
          )} tracking-wide`}
        >
          {item.category.replace("_", " ").toUpperCase()}
        </span>
        <button
          onClick={toggleFavorite}
          disabled={isLoading}
          className={`p-2 rounded-lg transition-colors border-0 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 ${
            item.is_favorited ? "text-yellow-400" : "text-neutral-400"
          }`}
          aria-label={item.is_favorited ? "Unfavorite" : "Favorite"}
        >
          <Star
            className={`w-5 h-5 ${item.is_favorited ? "fill-current" : ""}`}
          />
        </button>
      </div>

      <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2 leading-tight group-hover:text-primary transition-colors">
        <a
          href={item.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-start gap-2 focus:outline-none focus:ring-2 focus:ring-primary/30 rounded"
        >
          {item.title}
        </a>
      </h3>

      <p className="text-neutral-600 dark:text-neutral-300 text-base leading-relaxed mb-6 grow">
        {item.summary}
      </p>

      <div className="flex justify-between items-center pt-4 border-t border-neutral-100 dark:border-neutral-800 mt-auto">
        <div className="flex flex-col">
          <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 truncate max-w-[150px]">
            {item.source_name || "Unknown Source"}
          </span>
          <span className="text-xs text-neutral-300 dark:text-neutral-600">
            {format(new Date(item.date), "MMM d, yyyy")}
          </span>
        </div>

        <a
          href={item.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-neutral-300 dark:text-neutral-500 hover:text-primary dark:hover:text-white transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}
