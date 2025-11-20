"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-client";
import { DigestCard } from "@/components/DigestCard";
import { useRouter } from "next/navigation";

interface DigestItem {
  id: string;
  title: string;
  summary: string;
  category: string;
  source_name: string;
  source_url: string;
  link?: string;
  date: string;
  image_url?: string;
  reading_time_minutes?: number;
  sentiment?: string;
  similarity?: number;
  combined_score?: number;
  tldr?: string;
}

export default function ForYouPage() {
  const [items, setItems] = useState<DigestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [personalized, setPersonalized] = useState(false);
  const [userName, setUserName] = useState<string>("there");
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const loadFeed = async () => {
      setLoading(true);

      // Check authentication
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login?redirect=/for-you");
        return;
      }

      setUserName(
        user.user_metadata?.name || user.email?.split("@")[0] || "there"
      );

      // Fetch personalized feed
      const response = await fetch("/api/feed/personalized?limit=50");
      const data = await response.json();

      setItems(data.items || []);
      setPersonalized(data.personalized || false);
      setLoading(false);
    };

    loadFeed();
  }, [supabase, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">
              Loading your personalized feed...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">For You, {userName}</h1>
          <p className="text-muted-foreground">
            {personalized
              ? "Articles curated based on your reading history and preferences"
              : "Start reading articles to get personalized recommendations"}
          </p>
          {personalized && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              AI-Powered Recommendations
            </div>
          )}
        </div>

        {/* Feed */}
        {items.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <DigestCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium">No recommendations yet</h3>
            <p className="mt-2 text-muted-foreground">
              Start reading, favoriting, and interacting with articles to build
              your personalized feed.
            </p>
            <button
              onClick={() => router.push("/")}
              className="mt-6 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Explore Articles
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
