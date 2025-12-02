"use client";

import { createClient } from "@/lib/supabase-client";
import { format } from "date-fns";
import { ExternalLink, Star } from "lucide-react";
import { useEffect, useState } from "react";

interface DigestItem {
  id: string;
  title: string;
  summary: string;
  tldr?: string;
  sentiment?: string;
  source_url: string;
  source_name: string;
  category: string;
  is_favorited?: boolean;
  is_read?: boolean;
  date: string;
}

interface DigestCardProps {
  item: DigestItem;
}

export function DigestCard({ item }: DigestCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showTldr, setShowTldr] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isRead, setIsRead] = useState(false);
  const [clickTime, setClickTime] = useState<number | null>(null);
  const supabase = createClient();

  // Fetch user-specific favorite/read status
  useEffect(() => {
    const fetchUserStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("auth_user_id", user.id)
        .single();

      if (!profile) return;

      // Check if favorited
      const { data: favorite } = await supabase
        .from("user_favorites")
        .select("id")
        .eq("user_id", profile.id)
        .eq("digest_item_id", item.id)
        .single();

      setIsFavorited(!!favorite);

      // Check if read
      const { data: readStatus } = await supabase
        .from("user_read_status")
        .select("id")
        .eq("user_id", profile.id)
        .eq("digest_item_id", item.id)
        .single();

      setIsRead(!!readStatus);
    };

    fetchUserStatus();
  }, [item.id, supabase]);

  // Calculate reading time (assuming 200 words per minute)
  const calculateReadingTime = (text: string): number => {
    const words = text.trim().split(/\s+/).length;
    const minutes = Math.ceil(words / 200);
    return Math.max(1, minutes); // Minimum 1 minute
  };

  const readingTime = calculateReadingTime(item.summary);

  // Track interaction for personalization
  const trackInteraction = async (
    interactionType: "click" | "read" | "favorite" | "skip",
    dwellTimeSeconds?: number
  ) => {
    try {
      await fetch("/api/interactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          digest_item_id: item.id,
          interaction_type: interactionType,
          dwell_time_seconds: dwellTimeSeconds,
        }),
      });
    } catch (error) {
      console.error("Failed to track interaction:", error);
    }
  };

  const toggleFavorite = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/favorites/${item.id}`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setIsFavorited(data.is_favorited);

        // Track favorite interaction
        if (data.is_favorited) {
          void trackInteraction("favorite");
        }
      }
    } catch (error) {
      console.error("Failed to toggle favorite", error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async () => {
    if (!isRead) {
      setIsRead(true);
      try {
        await fetch(`/api/read/${item.id}`, { method: "POST" });
      } catch (error) {
        console.error("Failed to mark as read", error);
      }
    }
  };

  const handleCardClick = () => {
    // Record click time for dwell time calculation
    setClickTime(Date.now());

    // Track click interaction
    void trackInteraction("click");
  };

  const handleLinkClick = () => {
    // Calculate dwell time if user clicked earlier
    let dwellTime = 0;
    if (clickTime) {
      dwellTime = Math.round((Date.now() - clickTime) / 1000);
    }

    // Mark as read and track interaction
    markAsRead();
    void trackInteraction("read", dwellTime);
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
      case "official_news":
        return "bg-sky-100 dark:bg-sky-900 text-sky-800 dark:text-sky-200 border-sky-200 dark:border-sky-800";
      default:
        return "bg-neutral-100 dark:bg-neutral-900 text-neutral-800 dark:text-white border-neutral-200 dark:border-neutral-800";
    }
  };

  const getSentimentBadge = (sentiment?: string) => {
    if (!sentiment) return null;

    switch (sentiment) {
      case "drama":
        return { emoji: "🔥", label: "Drama", color: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800" };
      case "technical":
        return { emoji: "🧠", label: "Dense", color: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800" };
      case "breaking":
        return { emoji: "🚨", label: "Breaking", color: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800" };
      case "hot_take":
        return { emoji: "⚡", label: "Hot Take", color: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800" };
      case "educational":
        return { emoji: "📚", label: "Educational", color: "bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800" };
      default:
        return null;
    }
  };

  const sentimentBadge = getSentimentBadge(item.sentiment);

  return (
    <div
      onClick={handleCardClick}
      className={`bg-neutral-50 dark:bg-neutral-900 border border-transparent rounded-2xl p-6 shadow-none hover:shadow-md transition-all duration-200 flex flex-col h-full group ${
        item.is_read ? "opacity-60" : ""
      }`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`text-xs font-medium px-3 py-1 rounded-lg border ${getCategoryColor(
              item.category
            )} tracking-wide`}
          >
            {item.category.replace("_", " ").toUpperCase()}
          </span>
          <span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            {readingTime} min read
          </span>
          {sentimentBadge && (
            <span className={`text-xs font-medium px-2.5 py-1 rounded-lg border ${sentimentBadge.color}`}>
              {sentimentBadge.emoji} {sentimentBadge.label}
            </span>
          )}
        </div>
        <button
          onClick={toggleFavorite}
          disabled={isLoading}
          className={`p-2 rounded-lg transition-colors border-0 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 ${
            isFavorited ? "text-yellow-400" : "text-neutral-400"
          }`}
          aria-label={isFavorited ? "Unfavorite" : "Favorite"}
        >
          <Star
            className={`w-5 h-5 ${isFavorited ? "fill-current" : ""}`}
          />
        </button>
      </div>

      <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2 leading-tight group-hover:text-primary transition-colors">
        <a
          href={item.source_url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleLinkClick}
          className="flex items-start gap-2 focus:outline-none focus:ring-2 focus:ring-primary/30 rounded"
        >
          {item.title}
        </a>
      </h3>

      <div className="mb-6 grow">
        <p className="text-neutral-600 dark:text-neutral-300 text-base leading-relaxed">
          {showTldr && item.tldr ? item.tldr : item.summary}
        </p>
        {item.tldr && (
          <button
            onClick={() => setShowTldr(!showTldr)}
            className="mt-3 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
          >
            {showTldr ? "Show full summary" : "Show TL;DR"}
          </button>
        )}
      </div>

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
