"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

export default function ArchivePage() {
  const router = useRouter();
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Value>(new Date());

  useEffect(() => {
    fetchAvailableDates();
  }, []);

  const fetchAvailableDates = async () => {
    try {
      const response = await fetch("/api/digest/dates");
      const dates = await response.json();
      setAvailableDates(dates);
    } catch (error) {
      console.error("Failed to fetch available dates:", error);
    } finally {
      setLoading(false);
    }
  };

  const tileClassName = ({ date }: { date: Date }) => {
    const dateStr = date.toISOString().split("T")[0];
    if (availableDates.includes(dateStr)) {
      return "has-digest";
    }
    return null;
  };

  const handleDateClick = (value: Value) => {
    if (value instanceof Date) {
      const dateStr = value.toISOString().split("T")[0];
      if (availableDates.includes(dateStr)) {
        router.push(`/digest/${dateStr}`);
      }
    }
    setSelectedDate(value);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-100"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-gray-100 mb-3">
          Digest Archive
        </h1>
        <p className="text-gray-400 text-lg">Browse your past digests</p>
      </div>

      {availableDates.length === 0 ? (
        <div className="text-center py-20 bg-gray-800 rounded-xl">
          <p className="text-gray-400 text-lg">
            No digest archives available yet.
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Your digests will appear here once generated.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="bg-[#141414] rounded-xl shadow-xl p-8">
            <Calendar
              onChange={handleDateClick}
              value={selectedDate}
              tileClassName={tileClassName}
              maxDate={new Date()}
              className="custom-calendar"
            />
          </div>

          <div className="flex justify-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#0f0f0f] border border-gray-600 rounded-lg text-sm text-gray-400">
              <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></div>
              <span>Available digest</span>
            </div>
          </div>

          <div className="bg-[#141414] rounded-xl shadow-xl p-6">
            <h3 className="text-xl font-semibold text-gray-100 mb-4 flex items-center gap-2">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Recent Digests
            </h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {availableDates.slice(0, 30).map((date) => {
                const dateObj = new Date(date + "T00:00:00");
                const isToday = date === new Date().toISOString().split("T")[0];

                return (
                  <button
                    key={date}
                    onClick={() => router.push(`/digest/${date}`)}
                    className="group block w-full text-left px-4 py-3 rounded-lg hover:bg-gray-700 transition-all duration-200 border border-transparent hover:border-gray-600"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-gray-200 font-medium group-hover:text-white transition-colors">
                          {dateObj.toLocaleDateString("en-US", {
                            weekday: "long",
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </div>
                        <div className="text-gray-500 text-sm mt-0.5">
                          {isToday
                            ? "Today"
                            : dateObj.toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                        </div>
                      </div>
                      <svg
                        className="w-5 h-5 text-gray-600 group-hover:text-gray-400 transition-colors"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .custom-calendar {
          width: 100%;
          border: none;
          background: transparent;
          font-family: inherit;
        }

        .react-calendar__navigation {
          display: flex;
          margin-bottom: 1rem;
          height: 2.5rem;
          background: #00000000;
        }

        .react-calendar__navigation button {
          color: #fff;
          min-width: 2.5rem;
          background: transparent;
          font-size: 1rem;
          font-weight: 500;
          border-radius: 0.375rem;
          transition: background-color 0.2s;
        }

        .react-calendar__navigation button:enabled:hover {
          background-color: #22272b;
        }

        .react-calendar__navigation button:disabled {
          background: transparent;
          opacity: 0.4;
        }

        .react-calendar__viewContainer {
          margin-top: 0.5rem;
        }

        .react-calendar__month-view__weekdays {
          text-align: center;
          text-transform: uppercase;
          font-weight: 600;
          font-size: 0.75rem;
          color: #9ca3af;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid rgba(75, 85, 99, 0.5);
          margin-bottom: 0.5rem;
        }

        .react-calendar__month-view__weekdays__weekday {
          padding: 0.5rem;
        }

        .react-calendar__month-view__weekdays__weekday abbr {
          text-decoration: none;
        }

        .react-calendar__tile {
          padding: 0.75rem 0.5rem;
          background: transparent;
          text-align: center;
          font-size: 0.875rem;
          border-radius: 0.375rem;
          color: #d1d5db;
          transition: all 0.15s ease;
          position: relative;
          font-weight: 400;
        }

        .react-calendar__tile:enabled:hover {
          background-color: rgba(75, 70, 70, 0.4);
          color: #f3f4f6;
        }

        .react-calendar__tile--now {
          background: rgba(16, 185, 129, 0.1);
          color: #333333;
          font-weight: 500;
        }

        .react-calendar__tile--now:enabled:hover {
          background: rgba(16, 185, 129, 0.2);
        }

        .react-calendar__tile--active {
          background: rgba(16, 185, 129, 0.15);
          color: #10b981;
        }

        .react-calendar__tile--active:enabled:hover {
          background: rgba(16, 185, 129, 0.25);
        }

        .react-calendar__tile.has-digest {
          font-weight: 600;
          color: #fff;
          background: rgba(166, 166, 166, 0.08);
        }

        .react-calendar__tile.has-digest:enabled:hover {
          background: rgba(166, 166, 166, 0.15);
          color: #fff;
        }

        .react-calendar__tile.has-digest::after {
          content: "";
          position: absolute;
          bottom: 0.25rem;
          left: 50%;
          transform: translateX(-50%);
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background-color: #88f;
        }

        .react-calendar__month-view__days__day--neighboringMonth {
          opacity: 0.3;
        }

        .react-calendar__month-view__days__day--weekend {
          color: #f87171;
        }

        .react-calendar__tile:disabled {
          opacity: 0.2;
          cursor: not-allowed;
          background: transparent;
        }

        .react-calendar__tile:disabled:hover {
          background: transparent;
        }
      `}</style>
    </div>
  );
}
