"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Disc3, Mic2, Plus, Check, Loader2, Calendar, MapPin, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ReleaseGroup {
  id: string;
  title: string;
  type?: string;
  secondaryTypes?: string[];
  releaseDate?: string;
  coverUrl?: string | null;
}

interface Artist {
  id: string;
  name: string;
  type?: string;
  country?: string;
  disambiguation?: string;
  lifeSpan?: {
    begin?: string;
    end?: string;
    ended?: boolean;
  };
  tags?: Array<{ name: string; count: number }>;
  releaseGroups: ReleaseGroup[];
  releaseGroupCount: number;
}

export default function ArtistDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [requestingArtist, setRequestingArtist] = useState(false);
  const [requestingAlbums, setRequestingAlbums] = useState<Set<string>>(new Set());
  const [requestedItems, setRequestedItems] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    async function fetchArtist() {
      try {
        const response = await fetch(`/api/artist/${params.id}`);
        if (response.ok) {
          const data = await response.json();
          setArtist(data);
        }
      } catch (error) {
        console.error("Failed to fetch artist:", error);
      } finally {
        setIsLoading(false);
      }
    }

    if (params.id) {
      fetchArtist();
    }
  }, [params.id]);

  const handleRequestArtist = async () => {
    if (!artist) return;

    setRequestingArtist(true);
    try {
      const response = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          musicBrainzId: artist.id,
          type: "ARTIST",
          title: artist.name,
          coverUrl: artist.releaseGroups[0]?.coverUrl,
        }),
      });

      if (response.ok) {
        setRequestedItems((prev) => new Set([...prev, artist.id]));
      } else {
        const data = await response.json();
        alert(data.error || "Failed to create request");
      }
    } catch (error) {
      console.error("Request error:", error);
      alert("Failed to create request");
    } finally {
      setRequestingArtist(false);
    }
  };

  const handleRequestAlbum = async (album: ReleaseGroup) => {
    if (!artist) return;

    setRequestingAlbums((prev) => new Set([...prev, album.id]));
    try {
      const response = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          musicBrainzId: album.id,
          type: "ALBUM",
          title: album.title,
          artistName: artist.name,
          coverUrl: album.coverUrl,
        }),
      });

      if (response.ok) {
        setRequestedItems((prev) => new Set([...prev, album.id]));
      } else {
        const data = await response.json();
        alert(data.error || "Failed to create request");
      }
    } catch (error) {
      console.error("Request error:", error);
      alert("Failed to create request");
    } finally {
      setRequestingAlbums((prev) => {
        const next = new Set(prev);
        next.delete(album.id);
        return next;
      });
    }
  };

  const filteredReleaseGroups = artist?.releaseGroups.filter((rg) => {
    if (filter === "all") return true;
    return rg.type?.toLowerCase() === filter;
  });

  const releaseTypes = ["all", "album", "single", "ep", "compilation"];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="text-center py-24">
        <p className="text-gray-400">Artist not found</p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to search
      </button>

      {/* Artist Header */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-32 h-32 bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
            {artist.releaseGroups[0]?.coverUrl ? (
              <Image
                src={artist.releaseGroups[0].coverUrl}
                alt={artist.name}
                width={128}
                height={128}
                className="w-full h-full object-cover"
              />
            ) : (
              <Mic2 className="h-16 w-16 text-gray-500" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white">{artist.name}</h1>
                {artist.disambiguation && (
                  <p className="text-gray-400 mt-1">{artist.disambiguation}</p>
                )}
                <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-400">
                  {artist.type && (
                    <span className="flex items-center gap-1">
                      <Mic2 className="h-4 w-4" />
                      {artist.type}
                    </span>
                  )}
                  {artist.country && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {artist.country}
                    </span>
                  )}
                  {artist.lifeSpan?.begin && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {artist.lifeSpan.begin}
                      {artist.lifeSpan.ended && artist.lifeSpan.end && ` – ${artist.lifeSpan.end}`}
                    </span>
                  )}
                </div>
                {artist.tags && artist.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {artist.tags.slice(0, 5).map((tag) => (
                      <span
                        key={tag.name}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-gray-700 rounded text-xs text-gray-300"
                      >
                        <Tag className="h-3 w-3" />
                        {tag.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <Button
                onClick={handleRequestArtist}
                disabled={requestingArtist || requestedItems.has(artist.id)}
                className="flex-shrink-0"
              >
                {requestedItems.has(artist.id) ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Requested
                  </>
                ) : requestingArtist ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Request Artist
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Discography */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">
            Discography ({artist.releaseGroupCount})
          </h2>
          <div className="flex gap-2">
            {releaseTypes.map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={cn(
                  "px-3 py-1 rounded-full text-sm font-medium transition-colors capitalize",
                  filter === type
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                )}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filteredReleaseGroups?.map((album) => (
            <div
              key={album.id}
              className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-gray-600 transition-colors group"
            >
              <div className="aspect-square bg-gray-700 relative">
                {album.coverUrl ? (
                  <Image
                    src={album.coverUrl}
                    alt={album.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Disc3 className="h-12 w-12 text-gray-500" />
                  </div>
                )}
                <button
                  onClick={() => handleRequestAlbum(album)}
                  disabled={requestingAlbums.has(album.id) || requestedItems.has(album.id)}
                  className={cn(
                    "absolute inset-0 flex items-center justify-center bg-black/60 transition-opacity",
                    requestedItems.has(album.id)
                      ? "opacity-100"
                      : "opacity-0 group-hover:opacity-100"
                  )}
                >
                  {requestedItems.has(album.id) ? (
                    <div className="bg-green-600 p-3 rounded-full">
                      <Check className="h-6 w-6 text-white" />
                    </div>
                  ) : requestingAlbums.has(album.id) ? (
                    <div className="bg-indigo-600 p-3 rounded-full">
                      <Loader2 className="h-6 w-6 text-white animate-spin" />
                    </div>
                  ) : (
                    <div className="bg-indigo-600 p-3 rounded-full hover:bg-indigo-500 transition-colors">
                      <Plus className="h-6 w-6 text-white" />
                    </div>
                  )}
                </button>
              </div>
              <div className="p-3">
                <h3 className="font-medium text-white text-sm truncate">
                  {album.title}
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  {album.type || "Release"}
                  {album.releaseDate && ` • ${album.releaseDate.split("-")[0]}`}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
