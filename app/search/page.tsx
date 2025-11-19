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
}

function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const [results, setResults] = useState<DigestItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      if (!query.trim()) {
        setResults([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data);
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query]);

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
