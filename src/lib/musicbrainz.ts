// MusicBrainz API client with rate limiting
// API docs: https://musicbrainz.org/doc/MusicBrainz_API

const MUSICBRAINZ_BASE_URL = "https://musicbrainz.org/ws/2";
const COVER_ART_BASE_URL = "https://coverartarchive.org";
const USER_AGENT = "RecordStore/1.0.0 (https://github.com/recordstore)";

// Rate limiting: MusicBrainz allows 1 request per second
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1100; // 1.1 seconds to be safe

async function rateLimitedFetch(url: string): Promise<Response> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise((resolve) =>
      setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest)
    );
  }

  lastRequestTime = Date.now();

  const response = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`MusicBrainz API error: ${response.status}`);
  }

  return response;
}

export interface MusicBrainzArtist {
  id: string;
  name: string;
  "sort-name": string;
  type?: string;
  country?: string;
  disambiguation?: string;
  "life-span"?: {
    begin?: string;
    end?: string;
    ended?: boolean;
  };
  tags?: Array<{ name: string; count: number }>;
}

export interface MusicBrainzRelease {
  id: string;
  title: string;
  status?: string;
  date?: string;
  country?: string;
  "release-group"?: {
    id: string;
    "primary-type"?: string;
    "secondary-types"?: string[];
  };
  "artist-credit"?: Array<{
    artist: MusicBrainzArtist;
  }>;
  "track-count"?: number;
}

export interface MusicBrainzReleaseGroup {
  id: string;
  title: string;
  "primary-type"?: string;
  "secondary-types"?: string[];
  "first-release-date"?: string;
  "artist-credit"?: Array<{
    artist: MusicBrainzArtist;
  }>;
}

export interface SearchArtistsResponse {
  created: string;
  count: number;
  offset: number;
  artists: MusicBrainzArtist[];
}

export interface SearchReleasesResponse {
  created: string;
  count: number;
  offset: number;
  releases: MusicBrainzRelease[];
}

export interface SearchReleaseGroupsResponse {
  created: string;
  count: number;
  offset: number;
  "release-groups": MusicBrainzReleaseGroup[];
}

// Search for artists
export async function searchArtists(
  query: string,
  limit = 25,
  offset = 0
): Promise<SearchArtistsResponse> {
  const url = new URL(`${MUSICBRAINZ_BASE_URL}/artist`);
  url.searchParams.set("query", query);
  url.searchParams.set("limit", limit.toString());
  url.searchParams.set("offset", offset.toString());
  url.searchParams.set("fmt", "json");

  const response = await rateLimitedFetch(url.toString());
  return response.json();
}

// Search for release groups (albums)
export async function searchReleaseGroups(
  query: string,
  limit = 25,
  offset = 0
): Promise<SearchReleaseGroupsResponse> {
  const url = new URL(`${MUSICBRAINZ_BASE_URL}/release-group`);
  url.searchParams.set("query", query);
  url.searchParams.set("limit", limit.toString());
  url.searchParams.set("offset", offset.toString());
  url.searchParams.set("fmt", "json");

  const response = await rateLimitedFetch(url.toString());
  return response.json();
}

// Get artist by ID with release groups
export async function getArtist(
  artistId: string
): Promise<MusicBrainzArtist & { "release-groups"?: MusicBrainzReleaseGroup[] }> {
  const url = new URL(`${MUSICBRAINZ_BASE_URL}/artist/${artistId}`);
  url.searchParams.set("inc", "release-groups+tags");
  url.searchParams.set("fmt", "json");

  const response = await rateLimitedFetch(url.toString());
  return response.json();
}

// Get release group by ID
export async function getReleaseGroup(
  releaseGroupId: string
): Promise<MusicBrainzReleaseGroup & { releases?: MusicBrainzRelease[] }> {
  const url = new URL(`${MUSICBRAINZ_BASE_URL}/release-group/${releaseGroupId}`);
  url.searchParams.set("inc", "releases+artist-credits");
  url.searchParams.set("fmt", "json");

  const response = await rateLimitedFetch(url.toString());
  return response.json();
}

// Get artist's release groups (albums/EPs/singles)
export async function getArtistReleaseGroups(
  artistId: string,
  type?: string,
  limit = 100,
  offset = 0
): Promise<{ "release-groups": MusicBrainzReleaseGroup[]; "release-group-count": number }> {
  const url = new URL(`${MUSICBRAINZ_BASE_URL}/release-group`);
  url.searchParams.set("artist", artistId);
  url.searchParams.set("limit", limit.toString());
  url.searchParams.set("offset", offset.toString());
  if (type) {
    url.searchParams.set("type", type);
  }
  url.searchParams.set("fmt", "json");

  const response = await rateLimitedFetch(url.toString());
  return response.json();
}

// Get cover art for a release group
export async function getCoverArt(
  releaseGroupId: string
): Promise<string | null> {
  try {
    const url = `${COVER_ART_BASE_URL}/release-group/${releaseGroupId}`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    // Get the front cover image (prefer 500px thumbnail)
    const frontImage = data.images?.find(
      (img: { front: boolean }) => img.front
    );

    if (frontImage) {
      return (
        frontImage.thumbnails?.["500"] ||
        frontImage.thumbnails?.large ||
        frontImage.image
      );
    }

    return data.images?.[0]?.thumbnails?.["500"] || data.images?.[0]?.image || null;
  } catch {
    return null;
  }
}

// Batch get cover art URLs for multiple release groups
export async function batchGetCoverArt(
  releaseGroupIds: string[]
): Promise<Map<string, string | null>> {
  const results = new Map<string, string | null>();

  // Process in parallel but respect rate limiting by not using MusicBrainz rate limiter
  // Cover Art Archive has different rate limits
  const promises = releaseGroupIds.map(async (id) => {
    const coverUrl = await getCoverArt(id);
    results.set(id, coverUrl);
  });

  await Promise.all(promises);
  return results;
}
