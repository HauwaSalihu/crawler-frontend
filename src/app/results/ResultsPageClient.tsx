"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import ExportButtons from "../../components/ExportButtons";

export default function ResultsPageClient() {
  const searchParams = useSearchParams();
  const industry = searchParams.get("industry") || "";
  const region = searchParams.get("region") || "";
  const jobIdParam = searchParams.get("jobId");

  const [jobId, setJobId] = useState<string | null>(null);
  const [raw, setRaw] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [view, setView] = useState<"raw" | "results">("raw");
  const [loading, setLoading] = useState(false);
  const [enriching, setEnriching] = useState(false);
  const [enrichProgress, setEnrichProgress] = useState(0);
  const ENRICH_TIMEOUT = 8 * 60 * 1000; // 8 minutes in ms

  // Pagination state
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const fetchResults = async (id: string) => {
      setLoading(true);
      interval = setInterval(async () => {
        const res2 = await fetch(`${API_URL}api/results/${id}`);
        const jobData = await res2.json();
        if ((jobData.results && jobData.results.length > 0) || (jobData.raw && jobData.raw.length > 0)) {
          setRaw(jobData.raw || []);
          setResults(jobData.results || []);
          setLoading(false);
          clearInterval(interval);
        }
      }, 4000);
    };

    const handleSearch = async () => {
      if (jobIdParam) {
        setJobId(jobIdParam);
        fetchResults(jobIdParam);
        return;
      }

      if (!industry || !region) return;

      setLoading(true);
      const res = await fetch(`${API_URL}api/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ industry, region }),
      });
      const data = await res.json();
      setJobId(data.jobId);
      fetchResults(data.jobId);
    };

    handleSearch();

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [industry, region, jobIdParam]);

  const currentData = view === "raw" ? raw : results;

  // Pagination slice
  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return currentData.slice(start, start + pageSize);
  }, [currentData, page]);

  // Collect dynamic columns for RAW only
  const rawColumns = useMemo(() => {
    if (view !== "raw" || currentData.length === 0) return [];
    const keys = new Set<string>();
    currentData.forEach((item) => {
      Object.keys(item).forEach((key) => {
        if (key !== "_id") keys.add(key);
      });
    });
    return Array.from(keys);
  }, [currentData, view]);

  const enrichedColumns = ["title", "url", "emails", "phones", "ceo", "linkedinProfile"];

  useEffect(() => {
    if (view !== "results" || !jobId) {
      setEnriching(false);
      setEnrichProgress(0);
      return;
    }

    setEnriching(true);
    setEnrichProgress(0);

    let startTime = Date.now();
    let interval = setInterval(async () => {
      const res = await fetch(`${API_URL}api/results/${jobId}`);
      const jobData = await res.json();

      // Calculate progress based on enriched count vs raw count
      const total = jobData.raw?.length || 0;
      const enriched = jobData.results?.length || 0;
      let percent = total > 0 ? Math.round((enriched / total) * 100) : 0;
      setEnrichProgress(percent);

      // If enrichment is complete, populate results and stop loader
      if (percent >= 100 && enriched === total && total > 0) {
        setResults(jobData.results || []);
        setEnriching(false);
        setEnrichProgress(100);
        clearInterval(interval);
      }

      // Timeout after 8 minutes
      if (Date.now() - startTime > ENRICH_TIMEOUT) {
        setEnriching(false);
        clearInterval(interval);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [view, jobId, API_URL]);

  return (
    <div className="min-h-screen bg-blue-100 flex items-center justify-center py-8 px-2">
      <div className="w-full max-w-6xl mx-auto text-center">
        {/* Header */}
        <h1 className="text-5xl font-extrabold text-black drop-shadow-lg mb-2">
          Thunder Crawler
        </h1>
        <p className="text-xl text-white/80 mb-6 font-medium">
          <span className="bg-black/20 px-3 py-1 rounded-xl text-blue-900 font-semibold shadow">
            AI Lead Generation Prototype
          </span>
        </p>

        {/* Toggle View */}
        <div className="flex gap-4 mb-6 justify-center">
          <button
            className={`px-6 py-2 rounded-xl font-semibold transition text-lg ${
              view === "raw" ? "bg-blue-700 text-white shadow-lg" : "bg-white/70 text-blue-700 hover:bg-blue-100"
            }`}
            onClick={() => {
              setView("raw");
              setPage(1);
            }}
          >
            Raw Results
          </button>
          <button
            className={`px-6 py-2 rounded-xl font-semibold transition text-lg ${
              view === "results" ? "bg-blue-700 text-white shadow-lg" : "bg-white/70 text-blue-700 hover:bg-blue-100"
            }`}
            onClick={() => {
              setView("results");
              setPage(1);
            }}
          >
            Enriched Results
          </button>
        </div>

        {/* Job ID Test Button */}
        <div className="flex justify-end mb-4">
          <button
            onClick={() => {
              const specificId = "68e23ed7fd6cd72f4bc53e29"; // replace with known jobId
              setJobId(specificId);
              setLoading(true);
              fetch(`${API_URL}api/results/${specificId}`)
                .then((res) => res.json())
                .then((jobData) => {
                  setRaw(jobData.raw || []);
                  setResults(jobData.results || []);
                  setLoading(false);
                });
            }}
            className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-5 py-2 rounded-xl font-semibold shadow hover:scale-105 transition"
          >
            Show Data for Job ID
          </button>
        </div>

        {/* Export Buttons */}
        <ExportButtons data={currentData} />

        {/* Results Display */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-8 mt-3 overflow-x-auto">
          {view === "results" && enriching ? (
            <div className="flex flex-col items-center py-12 w-full">
              <span className="text-blue-700 font-bold text-xl mb-2">Enriching results...</span>
              <div className="w-full max-w-lg bg-gray-200 rounded h-4 mt-2 overflow-hidden">
                <div
                  className="bg-blue-500 h-4 transition-all duration-500"
                  style={{ width: `${enrichProgress}%` }}
                />
              </div>
              <span className="text-sm text-gray-600 mt-2">
                {enrichProgress < 100
                  ? `Progress: ${enrichProgress}% (up to 20 min)`
                  : "Completed!"}
              </span>
            </div>
          ) : loading ? (
            <div className="flex justify-center items-center py-12">
              <svg
                className="animate-spin h-10 w-10 text-blue-600 mr-3"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
              </svg>
              <span className="text-blue-700 font-bold text-xl">Loading...</span>
            </div>
          ) : currentData.length === 0 ? (
            <p className="text-lg text-gray-500 text-center">No {view} results yet.</p>
          ) : (
            <table className="min-w-full text-left table-fixed border border-gray-300 bg-white rounded-lg overflow-hidden">
              <thead className="bg-blue-600 text-white">
                <tr>
                  {(view === "raw" ? rawColumns : enrichedColumns).map((col) => (
                    <th
                      key={col}
                      className="px-4 py-2 text-left text-sm font-semibold w-40"
                    >
                      {col.toUpperCase()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((row, i) => (
                  <tr key={i} className="border-t border-gray-200 hover:bg-gray-50">
                    {(view === "raw" ? rawColumns : enrichedColumns).map((col) => {
                      let value: any = row[col];

                      if (col === "emails") {
                        value =
                          row.site?.emails?.join(", ") ||
                          row.emails?.join(", ") ||
                          "N/A";
                      }

                      if (col === "phones") {
                        value =
                          row.site?.phones?.join(", ") ||
                          row.phones?.join(", ") ||
                          (row.site?.phone ? String(row.site.phone) : "") ||
                          (row.phone ? String(row.phone) : "") ||
                          "N/A";
                      }

                      if (col === "ceo") {
                        value = row.linkedin?.ceo || row.ceo || row.site?.ceo || "N/A";
                      }

                      if (col === "linkedinProfile") {
                        const link =
                          row.linkedin?.profile ||
                          row.linkedinProfile ||
                          row.site?.linkedin_page ||
                          row.site?.linkedin ||
                          "";
                        return (
                          <td
                            key={col}
                            className="px-4 py-2 text-sm text-blue-600 underline w-40 break-words"
                          >
                            {link ? (
                              <a href={link} target="_blank" rel="noreferrer">
                                {link}
                              </a>
                            ) : (
                              "N/A"
                            )}
                          </td>
                        );
                      }

                      return (
                        <td
                          key={col}
                          className="px-4 py-2 text-sm text-gray-700 w-40 break-words"
                        >
                          {value || "N/A"}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Controls */}
        {currentData.length > pageSize && (
          <div className="flex justify-center items-center gap-4 mt-6">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-300"
            >
              Prev
            </button>
            <span className="font-semibold">
              Page {page} of {Math.ceil(currentData.length / pageSize)}
            </span>
            <button
              disabled={page === Math.ceil(currentData.length / pageSize)}
              onClick={() => setPage((p) => p + 1)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-300"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}