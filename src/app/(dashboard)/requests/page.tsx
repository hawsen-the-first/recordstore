"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Disc3, Mic2, Clock, CheckCircle, XCircle, Loader2, Music } from "lucide-react";
import { cn } from "@/lib/utils";

interface Request {
  id: string;
  musicBrainzId: string;
  type: "ALBUM" | "ARTIST";
  title: string;
  artistName?: string;
  coverUrl?: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "PROCESSING" | "AVAILABLE";
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
}

const statusConfig = {
  PENDING: {
    label: "Pending",
    icon: Clock,
    color: "text-yellow-500",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/20",
  },
  APPROVED: {
    label: "Approved",
    icon: CheckCircle,
    color: "text-green-500",
    bg: "bg-green-500/10",
    border: "border-green-500/20",
  },
  REJECTED: {
    label: "Rejected",
    icon: XCircle,
    color: "text-red-500",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
  },
  PROCESSING: {
    label: "Processing",
    icon: Loader2,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
  },
  AVAILABLE: {
    label: "Available",
    icon: CheckCircle,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
  },
};

export default function RequestsPage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    async function fetchRequests() {
      try {
        const response = await fetch("/api/requests");
        if (response.ok) {
          const data = await response.json();
          setRequests(data);
        }
      } catch (error) {
        console.error("Failed to fetch requests:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchRequests();
  }, []);

  const filteredRequests = requests.filter((request) => {
    if (filter === "all") return true;
    return request.status === filter;
  });

  const statusFilters = ["all", "PENDING", "APPROVED", "REJECTED", "PROCESSING", "AVAILABLE"];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">My Requests</h1>
        <p className="text-gray-400 mt-2">
          Track the status of your music requests
        </p>
      </div>

      {/* Status Filter */}
      <div className="flex flex-wrap gap-2">
        {statusFilters.map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              filter === status
                ? "bg-indigo-600 text-white"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            )}
          >
            {status === "all" ? "All" : statusConfig[status as keyof typeof statusConfig].label}
            {status !== "all" && (
              <span className="ml-2 text-xs opacity-70">
                ({requests.filter((r) => r.status === status).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Requests List */}
      {filteredRequests.length === 0 ? (
        <div className="text-center py-12">
          <Music className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">
            {filter === "all"
              ? "You haven't made any requests yet"
              : `No ${statusConfig[filter as keyof typeof statusConfig]?.label.toLowerCase()} requests`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request) => {
            const status = statusConfig[request.status];
            const StatusIcon = status.icon;

            return (
              <div
                key={request.id}
                className={cn(
                  "bg-gray-800 rounded-lg p-4 border transition-colors",
                  status.border
                )}
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                    {request.coverUrl ? (
                      <Image
                        src={request.coverUrl}
                        alt={request.title}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    ) : request.type === "ARTIST" ? (
                      <Mic2 className="h-8 w-8 text-gray-500" />
                    ) : (
                      <Disc3 className="h-8 w-8 text-gray-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-white truncate">
                        {request.title}
                      </h3>
                      <span className="text-xs px-2 py-0.5 bg-gray-700 rounded text-gray-300 flex-shrink-0">
                        {request.type}
                      </span>
                    </div>
                    {request.artistName && (
                      <p className="text-sm text-gray-400 truncate">
                        {request.artistName}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Requested on {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <div
                      className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium",
                        status.bg,
                        status.color
                      )}
                    >
                      <StatusIcon
                        className={cn(
                          "h-4 w-4",
                          request.status === "PROCESSING" && "animate-spin"
                        )}
                      />
                      {status.label}
                    </div>
                    {request.adminNote && (
                      <p className="text-xs text-gray-500 mt-2 max-w-48 truncate">
                        Note: {request.adminNote}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
