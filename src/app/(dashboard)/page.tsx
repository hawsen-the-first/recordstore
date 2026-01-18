"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Search, ListMusic, Shield, Music2, Disc3, Mic2 } from "lucide-react";

export default function HomePage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="text-center py-12">
        <h1 className="text-4xl font-bold text-white mb-4">
          Welcome to RecordStore
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          Discover and request music for your library. Search for your favorite
          artists and albums, and let us handle the rest.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link
          href="/search"
          className="group bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-indigo-500 transition-colors"
        >
          <div className="flex items-center space-x-4">
            <div className="bg-indigo-600 p-3 rounded-lg group-hover:bg-indigo-500 transition-colors">
              <Search className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Search Music</h3>
              <p className="text-gray-400 text-sm">
                Find artists and albums to request
              </p>
            </div>
          </div>
        </Link>

        <Link
          href="/requests"
          className="group bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-indigo-500 transition-colors"
        >
          <div className="flex items-center space-x-4">
            <div className="bg-green-600 p-3 rounded-lg group-hover:bg-green-500 transition-colors">
              <ListMusic className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">My Requests</h3>
              <p className="text-gray-400 text-sm">
                View your request history
              </p>
            </div>
          </div>
        </Link>

        {isAdmin && (
          <Link
            href="/admin"
            className="group bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-indigo-500 transition-colors"
          >
            <div className="flex items-center space-x-4">
              <div className="bg-purple-600 p-3 rounded-lg group-hover:bg-purple-500 transition-colors">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Admin Panel</h3>
                <p className="text-gray-400 text-sm">
                  Manage requests and settings
                </p>
              </div>
            </div>
          </Link>
        )}
      </div>

      {/* Features Section */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">
          How it works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-800 rounded-full mb-4">
              <Mic2 className="h-8 w-8 text-indigo-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Search Artists
            </h3>
            <p className="text-gray-400">
              Use MusicBrainz to find your favorite artists and their
              discographies.
            </p>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-800 rounded-full mb-4">
              <Disc3 className="h-8 w-8 text-indigo-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Request Albums
            </h3>
            <p className="text-gray-400">
              Submit requests for albums or entire artist catalogs you want
              added.
            </p>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-800 rounded-full mb-4">
              <Music2 className="h-8 w-8 text-indigo-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Enjoy Music
            </h3>
            <p className="text-gray-400">
              Once approved, your music is automatically added to the library
              via Lidarr.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
