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
        return "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800";
      case "ml_news":
        return "bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 border-purple-200 dark:border-purple-800";
      case "productivity":
        return "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800";
      default:
        return "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700";
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col h-full group">
      <div className="flex justify-between items-start mb-3">
        <span
          className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${getCategoryColor(
            item.category
          )}`}
        >
          {item.category.replace("_", " ").toUpperCase()}
        </span>
        <button
          onClick={toggleFavorite}
          disabled={isLoading}
          className={`p-1.5 rounded-full transition-colors ${
            item.is_favorited
              ? "text-yellow-400 hover:bg-yellow-50"
              : "text-gray-300 hover:bg-gray-100 hover:text-gray-400"
          }`}
          aria-label={item.is_favorited ? "Unfavorite" : "Favorite"}
        >
          <Star
            className={`w-5 h-5 ${item.is_favorited ? "fill-current" : ""}`}
          />
        </button>
      </div>

      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2 leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
        <a
          href={item.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-start gap-2"
        >
          {item.title}
        </a>
      </h3>

      <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-4 grow">
        {item.summary}
      </p>

      <div className="flex justify-between items-center pt-4 border-t border-gray-100 dark:border-gray-700 mt-auto">
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate max-w-[150px]">
            {item.source_name || "Unknown Source"}
          </span>
          <span className="text-[10px] text-gray-400 dark:text-gray-500">
            {format(new Date(item.date), "MMM d, yyyy")}
          </span>
        </div>

        <a
          href={item.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}
