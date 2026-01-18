import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { searchArtists, getCoverArt, getArtistReleaseGroups } from "@/lib/musicbrainz";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q");
  const limit = parseInt(searchParams.get("limit") || "25");
  const offset = parseInt(searchParams.get("offset") || "0");

  if (!query) {
    return NextResponse.json({ error: "Query parameter 'q' is required" }, { status: 400 });
  }

  try {
    const results = await searchArtists(query, limit, offset);

    // Get cover art for the first album of each artist (for display purposes)
    const artistsWithCovers = await Promise.all(
      results.artists.slice(0, 10).map(async (artist) => {
        try {
          const releaseGroups = await getArtistReleaseGroups(artist.id, "album", 1);
          const firstAlbum = releaseGroups["release-groups"]?.[0];
          let coverUrl = null;

          if (firstAlbum) {
            coverUrl = await getCoverArt(firstAlbum.id);
          }

          return {
            ...artist,
            coverUrl,
          };
        } catch {
          return { ...artist, coverUrl: null };
        }
      })
    );

    // Add remaining artists without cover art
    const remainingArtists = results.artists.slice(10).map((artist) => ({
      ...artist,
      coverUrl: null,
    }));

    return NextResponse.json({
      ...results,
      artists: [...artistsWithCovers, ...remainingArtists],
    });
  } catch (error) {
    console.error("Search artists error:", error);
    return NextResponse.json(
      { error: "Failed to search artists" },
      { status: 500 }
    );
  }
}
