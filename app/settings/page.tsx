"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, ToggleLeft, ToggleRight } from "lucide-react";

interface RSSSource {
  id: string;
  url: string;
  name: string;
  category: string;
  is_active: boolean;
}

export default function SettingsPage() {
  const [sources, setSources] = useState<RSSSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSource, setNewSource] = useState({ url: "", name: "", category: "dev_tools" });
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchSources();
  }, []);

  const fetchSources = async () => {
    try {
      const res = await fetch("/api/sources");
      const data = await res.json();
      setSources(data);
    } catch (error) {
      console.error("Failed to fetch sources:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSource = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    try {
      await fetch("/api/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSource),
      });
      setNewSource({ url: "", name: "", category: "dev_tools" });
      fetchSources();
    } catch (error) {
      console.error("Failed to add source:", error);
    } finally {
      setAdding(false);
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      await fetch(`/api/sources/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !isActive }),
      });
      fetchSources();
    } catch (error) {
      console.error("Failed to toggle source:", error);
    }
  };

  const deleteSource = async (id: string) => {
    if (!confirm("Are you sure you want to delete this source?")) return;
    try {
      await fetch(`/api/sources/${id}`, { method: "DELETE" });
      fetchSources();
    } catch (error) {
      console.error("Failed to delete source:", error);
    }
  };

  const groupedSources = sources.reduce((acc, source) => {
    if (!acc[source.category]) acc[source.category] = [];
    acc[source.category].push(source);
    return acc;
  }, {} as Record<string, RSSSource[]>);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-neutral-900 dark:border-neutral-100"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-8">RSS Source Management</h1>

      {/* Add New Source Form */}
      <div className="bg-neutral-100 dark:bg-neutral-900 p-6 rounded-xl mb-8 border border-neutral-200 dark:border-neutral-800">
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Add New Source
        </h2>
        <form onSubmit={handleAddSource} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              RSS Feed URL or Reddit (r/subreddit)
            </label>
            <input
              type="text"
              value={newSource.url}
              onChange={(e) => setNewSource({ ...newSource, url: e.target.value })}
              className="w-full px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:text-white"
              placeholder="https://example.com/feed or r/programming"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Source Name</label>
            <input
              type="text"
              value={newSource.name}
              onChange={(e) => setNewSource({ ...newSource, name: e.target.value })}
              className="w-full px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:text-white"
              placeholder="My Favorite Blog"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Category</label>
            <select
              value={newSource.category}
              onChange={(e) => setNewSource({ ...newSource, category: e.target.value })}
              className="w-full px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:text-white"
            >
              <option value="f1">F1</option>
              <option value="dev_tools">Dev Tools</option>
              <option value="ml_news">ML News</option>
              <option value="productivity">Productivity</option>
              <option value="misc">Misc</option>
              <option value="reddit">Reddit</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={adding}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {adding ? "Adding..." : "Add Source"}
          </button>
        </form>
      </div>

      {/* Sources List */}
      <div className="space-y-6">
        {Object.entries(groupedSources).map(([category, categorySources]) => (
          <div key={category} className="bg-neutral-100 dark:bg-neutral-900 p-6 rounded-xl border border-neutral-200 dark:border-neutral-800">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4 capitalize">
              {category.replace("_", " ")} ({categorySources.length})
            </h3>
            <div className="space-y-3">
              {categorySources.map((source) => (
                <div
                  key={source.id}
                  className="flex items-center justify-between p-4 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700"
                >
                  <div className="flex-1">
                    <div className="font-medium text-neutral-900 dark:text-white">{source.name}</div>
                    <div className="text-sm text-neutral-500 dark:text-neutral-400 truncate">{source.url}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleActive(source.id, source.is_active)}
                      className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
                      title={source.is_active ? "Disable" : "Enable"}
                    >
                      {source.is_active ? (
                        <ToggleRight className="w-6 h-6 text-green-500" />
                      ) : (
                        <ToggleLeft className="w-6 h-6 text-neutral-400" />
                      )}
                    </button>
                    <button
                      onClick={() => deleteSource(source.id)}
                      className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors text-red-600"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
