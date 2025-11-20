"use client";

import { DigestCard } from "@/components/DigestCard";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

interface DigestItem {
  id: string;
  title: string;
  summary: string;
  source_url: string;
  source_name: string;
  category: string;
  is_favorited: boolean;
  is_read?: boolean;
  date: string;
  link?: string;
  image_url?: string;
  reading_time_minutes?: number;
  sentiment?: string;
  similarity?: number;
  combined_score?: number;
}

function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const [results, setResults] = useState<DigestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [useSemanticSearch, setUseSemanticSearch] = useState(true);
  const [isPersonalized, setIsPersonalized] = useState(false);

  useEffect(() => {
    const fetchResults = async () => {
      if (!query.trim()) {
        setResults([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Try semantic search first, fallback to keyword search
        const endpoint = useSemanticSearch
          ? `/api/search/semantic?q=${encodeURIComponent(query)}&limit=50`
          : `/api/search?q=${encodeURIComponent(query)}`;

        const res = await fetch(endpoint);
        const data = await res.json();

        // Check if results are personalized (have combined_score)
        if (Array.isArray(data) && data.length > 0 && data[0].combined_score !== undefined) {
          setIsPersonalized(true);
        } else {
          setIsPersonalized(false);
        }

        setResults(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Search failed:", error);
        // If semantic search fails, try keyword search
        if (useSemanticSearch) {
          try {
            const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
            const data = await res.json();
            setResults(data);
            setUseSemanticSearch(false);
          } catch (fallbackError) {
            console.error("Fallback search also failed:", fallbackError);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query, useSemanticSearch]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900 dark:border-gray-200"></div>
      </div>
    );
  }

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Search Results
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          {query ? (
            <>
              Found {results.length} result{results.length !== 1 ? "s" : ""} for
              &quot;{query}&quot;
            </>
          ) : (
            "Enter a search query to find articles"
          )}
        </p>
        {useSemanticSearch && results.length > 0 && (
          <div className="mt-4 flex items-center gap-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
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
              Semantic Search
            </div>
            {isPersonalized && (
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-secondary/10 text-secondary-foreground rounded-full text-sm font-medium">
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
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                Personalized for you
              </div>
            )}
          </div>
        )}
      </header>

      {results.length === 0 && query ? (
        <div className="text-center py-20">
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            No articles found for &quot;{query}&quot;
          </p>
          <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
            Try a different search term
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map((item) => (
            <DigestCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900 dark:border-gray-200"></div>
        </div>
      }
    >
      <SearchResults />
    </Suspense>
  );
}
