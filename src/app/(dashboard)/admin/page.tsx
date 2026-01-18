"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Disc3,
  Mic2,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Music,
  Trash2,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
  user: {
    id: string;
    username: string;
    email: string;
  };
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

export default function AdminPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [requests, setRequests] = useState<Request[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>("PENDING");
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  // Redirect non-admins
  useEffect(() => {
    if (session && session.user?.role !== "ADMIN") {
      router.push("/");
    }
  }, [session, router]);

  useEffect(() => {
    fetchRequests();
  }, []);

  async function fetchRequests() {
    try {
      const response = await fetch("/api/admin/requests");
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

  const handleStatusUpdate = async (
    requestId: string,
    status: "APPROVED" | "REJECTED"
  ) => {
    setProcessingIds((prev) => new Set([...prev, requestId]));

    try {
      const response = await fetch(`/api/admin/requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        const updatedRequest = await response.json();
        setRequests((prev) =>
          prev.map((r) => (r.id === requestId ? updatedRequest : r))
        );
      } else {
        const data = await response.json();
        alert(data.error || "Failed to update request");
      }
    } catch (error) {
      console.error("Update error:", error);
      alert("Failed to update request");
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(requestId);
        return next;
      });
    }
  };

  const handleDelete = async (requestId: string) => {
    if (!confirm("Are you sure you want to delete this request?")) return;

    setProcessingIds((prev) => new Set([...prev, requestId]));

    try {
      const response = await fetch(`/api/admin/requests/${requestId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setRequests((prev) => prev.filter((r) => r.id !== requestId));
      } else {
        const data = await response.json();
        alert(data.error || "Failed to delete request");
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete request");
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(requestId);
        return next;
      });
    }
  };

  const filteredRequests = requests.filter((request) => {
    if (filter === "all") return true;
    return request.status === filter;
  });

  const statusFilters = ["all", "PENDING", "APPROVED", "REJECTED", "PROCESSING", "AVAILABLE"];

  if (session?.user?.role !== "ADMIN") {
    return null;
  }

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
        <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-gray-400 mt-2">
          Manage music requests from all users
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Object.entries(statusConfig).map(([key, config]) => {
          const count = requests.filter((r) => r.status === key).length;
          return (
            <div
              key={key}
              className={cn(
                "bg-gray-800 rounded-lg p-4 border cursor-pointer transition-colors",
                filter === key ? config.border : "border-gray-700 hover:border-gray-600"
              )}
              onClick={() => setFilter(key)}
            >
              <div className="flex items-center justify-between">
                <span className={cn("text-2xl font-bold", config.color)}>
                  {count}
                </span>
                <config.icon className={cn("h-5 w-5", config.color)} />
              </div>
              <p className="text-sm text-gray-400 mt-1">{config.label}</p>
            </div>
          );
        })}
      </div>

      {/* Filter */}
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
          </button>
        ))}
      </div>

      {/* Requests List */}
      {filteredRequests.length === 0 ? (
        <div className="text-center py-12">
          <Music className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No requests to display</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request) => {
            const status = statusConfig[request.status];
            const StatusIcon = status.icon;
            const isProcessing = processingIds.has(request.id);

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
                    <div className="flex items-center gap-4 mt-1">
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <User className="h-3 w-3" />
                        {request.user.username}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium",
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
                    {request.status === "PENDING" && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleStatusUpdate(request.id, "APPROVED")}
                          disabled={isProcessing}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {isProcessing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleStatusUpdate(request.id, "REJECTED")}
                          disabled={isProcessing}
                        >
                          {isProcessing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <XCircle className="h-4 w-4" />
                          )}
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(request.id)}
                      disabled={isProcessing}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
