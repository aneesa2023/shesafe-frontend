import React, { useEffect, useState } from "react";
import { Clock, ChevronDown, X } from "lucide-react";

interface Incident {
  id: string;
  text: string;
  audioURL?: string;
  location?: { lat: number; lon: number };
  time: string;
  status: "Pending" | "AI Resolved" | "Escalated";
  aiSummary?: string;
  severity?: "low" | "medium" | "high";
  aiRecommendation?: string;
}

const AdminPage: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("incidents") || "[]");
    setIncidents(stored);
  }, []);

  const updateStatus = (id: string, newStatus: Incident["status"]) => {
    const updated = incidents.map((i) =>
      i.id === id ? { ...i, status: newStatus } : i
    );
    setIncidents(updated);
    localStorage.setItem("incidents", JSON.stringify(updated));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <header className="flex justify-between items-center px-8 py-4 bg-white shadow-sm border-b">
        <h1 className="text-xl font-bold text-rose-600">SheSafe Admin</h1>
        <span className="text-gray-600 text-sm">User Portal</span>
      </header>

      {/* Main */}
      <main className="max-w-6xl mx-auto p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Incident Dashboard</h2>
          <p className="text-gray-600 text-sm">
            Monitor and manage all reported incidents
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between bg-white border rounded-xl p-4 mb-6 shadow-sm">
          <div className="flex gap-3 items-center">
            <label className="text-sm text-gray-700 font-medium">Filter by Status:</label>
            <select className="border border-gray-300 rounded-md text-sm px-3 py-1.5">
              <option>All Incidents</option>
              <option>Pending</option>
              <option>AI Resolved</option>
              <option>Escalated</option>
            </select>

            <label className="text-sm text-gray-700 font-medium ml-4">Sort by:</label>
            <button className="flex items-center border border-gray-300 rounded-md text-sm px-3 py-1.5 hover:bg-gray-100">
              <ChevronDown size={14} className="mr-1" /> Time
            </button>
          </div>
          <span className="text-sm text-gray-600">{incidents.length} incidents</span>
        </div>

        <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b text-gray-600">
              <tr>
                <th className="text-left p-3 font-medium">DESCRIPTION</th>
                <th className="text-left p-3 font-medium">STATUS</th>
                <th className="text-left p-3 font-medium">TIME</th>
                <th className="text-right p-3 font-medium">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {incidents.map((i) => (
                <tr key={i.id} className="border-b hover:bg-gray-50 transition-all">
                  <td className="p-3 text-gray-800">{i.text || "(Audio Only)"}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        i.status === "Pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : i.status === "AI Resolved"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {i.status}
                    </span>
                  </td>
                  <td className="p-3 text-gray-600 flex items-center gap-1">
                    <Clock size={14} /> {i.time}
                  </td>
                  <td className="p-3 text-right">
                    <button
                      className="text-rose-600 hover:text-rose-700 font-medium text-sm"
                      onClick={() => setSelectedIncident(i)}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
              {incidents.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center text-gray-500 py-6">
                    No incidents reported yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* Modal for AI Analysis */}
      {selectedIncident && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 relative shadow-lg">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
              onClick={() => setSelectedIncident(null)}
            >
              <X size={20} />
            </button>
            <h2 className="text-xl font-bold text-rose-600 mb-3">AI Analysis</h2>
            <p className="mb-2"><span className="font-semibold">Description:</span> {selectedIncident.text}</p>
            {selectedIncident.aiSummary && (
              <>
                <p className="mb-2"><span className="font-semibold">Summary:</span> {selectedIncident.aiSummary}</p>
                <p className="mb-2"><span className="font-semibold">Severity:</span> {selectedIncident.severity}</p>
                <p className="mb-2"><span className="font-semibold">Recommendation:</span> {selectedIncident.aiRecommendation}</p>
              </>
            )}
            {!selectedIncident.aiSummary && (
              <p className="text-gray-500">No AI analysis available yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;