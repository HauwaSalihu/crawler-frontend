"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function HomePage() {
  const [industry, setIndustry] = useState("");
  const [region, setRegion] = useState("");
  const [previous, setPrevious] = useState<any[]>([]);
  const router = useRouter();

  // Fetch previous results
  useEffect(() => {
    const fetchPrevious = async () => {
      try {
        const res = await fetch("http://localhost:5001/api/searches");
        const data = await res.json();
        setPrevious(data || []);
      } catch (err) {
        console.error("Failed to load previous searches:", err);
      }
    };
    fetchPrevious();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!industry || !region) return;
    router.push(
      `/results?industry=${encodeURIComponent(industry)}&region=${encodeURIComponent(region)}`
    );
  };

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

        {/* Search Form */}
        <form
          onSubmit={handleSearch}
          className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-8 flex flex-col md:flex-row gap-6 items-center"
        >
          <input
            placeholder="Industry"
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            className="border border-gray-300 p-4 rounded-xl w-full md:w-1/2 text-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
          />
          <input
            placeholder="Region"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="border border-gray-300 p-4 rounded-xl w-full md:w-1/2 text-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
          />
          <button
            type="submit"
            className="bg-gradient-to-r from-blue-600 via-purple-500 to-pink-400 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg transition transform hover:scale-105 hover:shadow-2xl"
          >
            Search
          </button>
        </form>

        {/* Previous Results */}
        <div className="mt-10 bg-white/90 p-6 rounded-xl shadow text-left">
          <h2 className="text-lg font-semibold text-blue-900 mb-4">
            Previous Results
          </h2>

          {previous.length === 0 ? (
            <p className="text-gray-600 text-sm">No previous results yet.</p>
          ) : (
            <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-300 bg-white rounded-lg overflow-hidden">
              <thead className="bg-blue-600 text-white">
                  <tr className="text-sm uppercase">
                    <th className="px-4 py-2 border">Industry</th>
                    <th className="px-4 py-2 border">Region</th>
                    <th className="px-4 py-2 border">Status</th>
                    <th className="px-4 py-2 border">Created</th>
                    <th className="px-4 py-2 border">View</th>
                  </tr>
                </thead>
                <tbody>
                  {previous.map((item) => (
                    <tr key={item._id} className="text-sm hover:bg-gray-50">
                      <td className="px-4 py-2 border">{item.industry}</td>
                      <td className="px-4 py-2 border">{item.region}</td>
                      <td className="px-4 py-2 border">{item.status}</td>
                      <td className="px-4 py-2 border">
                        {new Date(item.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-2 border text-blue-600 underline cursor-pointer"
                        onClick={() => router.push(`/results?jobId=${item._id}`)}>
                       <button className="bg-blue-500 text-bold text-white px-3 py-1 rounded-lg hover:bg-blue-300 transition">
                        View Leads
                       </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}