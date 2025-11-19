"use client";

import { Newspaper } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Navbar() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === "/" && pathname === "/") return true;
    if (path !== "/" && pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <nav className="bg-white dark:bg-black border-b border-neutral-200 dark:border-neutral-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="shrink-0 flex items-center gap-2">
              <div className="bg-black dark:bg-neutral-900 text-white dark:text-white p-1.5 rounded-lg">
                <Newspaper className="w-5 h-5" />
              </div>
              <span className="font-bold text-xl tracking-tight dark:text-white">
                Bixby
              </span>
            </Link>

            <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
              <Link
                href="/"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive("/")
                    ? "border-black dark:border-white text-neutral-900 dark:text-white"
                    : "border-transparent text-neutral-500 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-600 hover:text-neutral-700 dark:hover:text-neutral-200"
                }`}
              >
                Today
              </Link>
              <Link
                href="/favorites"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive("/favorites")
                    ? "border-black dark:border-white text-neutral-900 dark:text-white"
                    : "border-transparent text-neutral-500 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-600 hover:text-neutral-700 dark:hover:text-neutral-200"
                }`}
              >
                Favorites
              </Link>
              <Link
                href="/digest/archive"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive("/digest")
                    ? "border-black dark:border-white text-neutral-900 dark:text-white"
                    : "border-transparent text-neutral-500 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-600 hover:text-neutral-700 dark:hover:text-neutral-200"
                }`}
              >
                Archive
              </Link>
            </div>
          </div>

          <div className="flex items-center">
            <div className="text-sm text-neutral-500 dark:text-neutral-400">
              Good Morning, Jason
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
