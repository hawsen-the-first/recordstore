import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getArtist, getArtistReleaseGroups, getCoverArt } from "@/lib/musicbrainz";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Get artist details
    const artist = await getArtist(id);

    // Get artist's release groups
    const releaseGroupsData = await getArtistReleaseGroups(id, undefined, 100);

    // Get cover art for albums (only for first 20 to avoid rate limiting issues)
    const releaseGroupsWithCovers = await Promise.all(
      releaseGroupsData["release-groups"].slice(0, 20).map(async (rg) => {
        const coverUrl = await getCoverArt(rg.id);
        return {
          id: rg.id,
          title: rg.title,
          type: rg["primary-type"],
          secondaryTypes: rg["secondary-types"],
          releaseDate: rg["first-release-date"],
          coverUrl,
        };
      })
    );

    // Add remaining without cover art
    const remainingReleaseGroups = releaseGroupsData["release-groups"]
      .slice(20)
      .map((rg) => ({
        id: rg.id,
        title: rg.title,
        type: rg["primary-type"],
        secondaryTypes: rg["secondary-types"],
        releaseDate: rg["first-release-date"],
        coverUrl: null,
      }));

    // Sort by release date (newest first)
    const allReleaseGroups = [...releaseGroupsWithCovers, ...remainingReleaseGroups].sort(
      (a, b) => {
        if (!a.releaseDate) return 1;
        if (!b.releaseDate) return -1;
        return b.releaseDate.localeCompare(a.releaseDate);
      }
    );

    return NextResponse.json({
      id: artist.id,
      name: artist.name,
      type: artist.type,
      country: artist.country,
      disambiguation: artist.disambiguation,
      lifeSpan: artist["life-span"],
      tags: artist.tags?.slice(0, 10),
      releaseGroups: allReleaseGroups,
      releaseGroupCount: releaseGroupsData["release-group-count"],
    });
  } catch (error) {
    console.error("Get artist error:", error);
    return NextResponse.json(
      { error: "Failed to fetch artist details" },
      { status: 500 }
    );
  }
}
