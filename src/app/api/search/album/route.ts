import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { searchReleaseGroups, getCoverArt } from "@/lib/musicbrainz";

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
    const results = await searchReleaseGroups(query, limit, offset);

    // Get cover art for albums
    const albumsWithCovers = await Promise.all(
      results["release-groups"].map(async (album) => {
        const coverUrl = await getCoverArt(album.id);
        const artistName = album["artist-credit"]?.[0]?.artist?.name || "Unknown Artist";

        return {
          id: album.id,
          title: album.title,
          artistName,
          artistId: album["artist-credit"]?.[0]?.artist?.id,
          type: album["primary-type"],
          secondaryTypes: album["secondary-types"],
          releaseDate: album["first-release-date"],
          coverUrl,
        };
      })
    );

    return NextResponse.json({
      count: results.count,
      offset: results.offset,
      albums: albumsWithCovers,
    });
  } catch (error) {
    console.error("Search albums error:", error);
    return NextResponse.json(
      { error: "Failed to search albums" },
      { status: 500 }
    );
  }
}
