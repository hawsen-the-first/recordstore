"use client";

import { useState } from "react";
import { Search, Disc3, Mic2, Music, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

type SearchType = "artist" | "album";

interface Artist {
  id: string;
  name: string;
  type?: string;
  country?: string;
  disambiguation?: string;
  coverUrl?: string | null;
}

interface Album {
  id: string;
  title: string;
  artistName: string;
  artistId?: string;
  type?: string;
  releaseDate?: string;
  coverUrl?: string | null;
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [searchType, setSearchType] = useState<SearchType>("artist");
  const [isLoading, setIsLoading] = useState(false);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setHasSearched(true);

    try {
      const endpoint = searchType === "artist" ? "/api/search/artist" : "/api/search/album";
      const response = await fetch(`${endpoint}?q=${encodeURIComponent(query)}`);
      const data = await response.json();

      if (searchType === "artist") {
        setArtists(data.artists || []);
        setAlbums([]);
      } else {
        setAlbums(data.albums || []);
        setArtists([]);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Search Music</h1>
        <p className="text-gray-400 mt-2">
          Search for artists or albums using MusicBrainz
        </p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setSearchType("artist")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors",
              searchType === "artist"
                ? "bg-indigo-600 text-white"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            )}
          >
            <Mic2 className="h-4 w-4" />
            Artists
          </button>
          <button
            type="button"
            onClick={() => setSearchType("album")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors",
              searchType === "album"
                ? "bg-indigo-600 text-white"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            )}
          >
            <Disc3 className="h-4 w-4" />
            Albums
          </button>
        </div>

        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              type="text"
              placeholder={`Search for ${searchType === "artist" ? "an artist" : "an album"}...`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-12 text-lg"
            />
          </div>
          <Button type="submit" size="lg" disabled={isLoading || !query.trim()}>
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Search className="h-5 w-5" />
            )}
          </Button>
        </div>
      </form>

      {/* Results */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mx-auto mb-4" />
            <p className="text-gray-400">Searching MusicBrainz...</p>
          </div>
        </div>
      )}

      {!isLoading && hasSearched && artists.length === 0 && albums.length === 0 && (
        <div className="text-center py-12">
          <Music className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No results found for &quot;{query}&quot;</p>
        </div>
      )}

      {/* Artist Results */}
      {!isLoading && artists.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white">
            Artists ({artists.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {artists.map((artist) => (
              <Link
                key={artist.id}
                href={`/artist/${artist.id}`}
                className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-colors border border-gray-700 hover:border-indigo-500"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                    {artist.coverUrl ? (
                      <Image
                        src={artist.coverUrl}
                        alt={artist.name}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Mic2 className="h-8 w-8 text-gray-500" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-white truncate">
                      {artist.name}
                    </h3>
                    <p className="text-sm text-gray-400 truncate">
                      {artist.type || "Artist"}
                      {artist.country && ` • ${artist.country}`}
                    </p>
                    {artist.disambiguation && (
                      <p className="text-xs text-gray-500 truncate">
                        {artist.disambiguation}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Album Results */}
      {!isLoading && albums.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white">
            Albums ({albums.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {albums.map((album) => (
              <Link
                key={album.id}
                href={`/album/${album.id}`}
                className="bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-750 transition-colors border border-gray-700 hover:border-indigo-500"
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
                      <Disc3 className="h-16 w-16 text-gray-500" />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-white truncate">
                    {album.title}
                  </h3>
                  <p className="text-sm text-gray-400 truncate">
                    {album.artistName}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {album.type || "Album"}
                    {album.releaseDate && ` • ${album.releaseDate.split("-")[0]}`}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
