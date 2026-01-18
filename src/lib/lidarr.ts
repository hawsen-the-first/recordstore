// Lidarr API client
// API docs: https://lidarr.audio/docs/api/

import { prisma } from "./prisma";

interface LidarrConfig {
  url: string;
  apiKey: string;
}

async function getLidarrConfig(): Promise<LidarrConfig | null> {
  const urlSetting = await prisma.settings.findUnique({
    where: { key: "lidarr_url" },
  });
  const apiKeySetting = await prisma.settings.findUnique({
    where: { key: "lidarr_api_key" },
  });

  if (!urlSetting?.value || !apiKeySetting?.value) {
    return null;
  }

  return {
    url: urlSetting.value.replace(/\/$/, ""), // Remove trailing slash
    apiKey: apiKeySetting.value,
  };
}

async function lidarrFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const config = await getLidarrConfig();

  if (!config) {
    throw new Error("Lidarr is not configured");
  }

  const url = `${config.url}/api/v1${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      "X-Api-Key": config.apiKey,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  return response;
}

export interface LidarrArtist {
  id: number;
  artistName: string;
  foreignArtistId: string;
  status: string;
  path: string;
  qualityProfileId: number;
  metadataProfileId: number;
  monitored: boolean;
}

export interface LidarrRootFolder {
  id: number;
  path: string;
  freeSpace: number;
}

export interface LidarrQualityProfile {
  id: number;
  name: string;
}

export interface LidarrMetadataProfile {
  id: number;
  name: string;
}

// Test Lidarr connection
export async function testLidarrConnection(): Promise<{
  success: boolean;
  error?: string;
  version?: string;
}> {
  try {
    const response = await lidarrFetch("/system/status");

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      version: data.version,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Get root folders
export async function getRootFolders(): Promise<LidarrRootFolder[]> {
  const response = await lidarrFetch("/rootfolder");

  if (!response.ok) {
    throw new Error(`Failed to get root folders: ${response.statusText}`);
  }

  return response.json();
}

// Get quality profiles
export async function getQualityProfiles(): Promise<LidarrQualityProfile[]> {
  const response = await lidarrFetch("/qualityprofile");

  if (!response.ok) {
    throw new Error(`Failed to get quality profiles: ${response.statusText}`);
  }

  return response.json();
}

// Get metadata profiles
export async function getMetadataProfiles(): Promise<LidarrMetadataProfile[]> {
  const response = await lidarrFetch("/metadataprofile");

  if (!response.ok) {
    throw new Error(`Failed to get metadata profiles: ${response.statusText}`);
  }

  return response.json();
}

// Search for artist in Lidarr
export async function searchArtist(
  term: string
): Promise<LidarrArtist[]> {
  const response = await lidarrFetch(`/artist/lookup?term=${encodeURIComponent(term)}`);

  if (!response.ok) {
    throw new Error(`Failed to search artist: ${response.statusText}`);
  }

  return response.json();
}

// Add artist to Lidarr
export async function addArtistToLidarr(
  musicBrainzId: string,
  type: "ARTIST" | "ALBUM"
): Promise<LidarrArtist | null> {
  const config = await getLidarrConfig();
  if (!config) {
    console.log("Lidarr not configured, skipping add");
    return null;
  }

  try {
    // Get default settings from database or use defaults
    const rootFolderSetting = await prisma.settings.findUnique({
      where: { key: "lidarr_root_folder" },
    });
    const qualityProfileSetting = await prisma.settings.findUnique({
      where: { key: "lidarr_quality_profile" },
    });
    const metadataProfileSetting = await prisma.settings.findUnique({
      where: { key: "lidarr_metadata_profile" },
    });

    // If no settings, get defaults from Lidarr
    let rootFolderPath = rootFolderSetting?.value;
    let qualityProfileId = qualityProfileSetting?.value ? parseInt(qualityProfileSetting.value) : undefined;
    let metadataProfileId = metadataProfileSetting?.value ? parseInt(metadataProfileSetting.value) : undefined;

    if (!rootFolderPath || !qualityProfileId || !metadataProfileId) {
      const [rootFolders, qualityProfiles, metadataProfiles] = await Promise.all([
        getRootFolders(),
        getQualityProfiles(),
        getMetadataProfiles(),
      ]);

      rootFolderPath = rootFolderPath || rootFolders[0]?.path;
      qualityProfileId = qualityProfileId || qualityProfiles[0]?.id;
      metadataProfileId = metadataProfileId || metadataProfiles[0]?.id;
    }

    if (!rootFolderPath || !qualityProfileId || !metadataProfileId) {
      throw new Error("Could not determine Lidarr configuration");
    }

    // For artist requests, search by MusicBrainz ID
    // For album requests, we need to find the artist first
    let searchTerm = `mbid:${musicBrainzId}`;
    if (type === "ALBUM") {
      // For albums, we search by the release group ID
      // Lidarr uses artist MBIDs, so we'll search by the album's artist
      searchTerm = `mbid:${musicBrainzId}`;
    }

    const searchResults = await searchArtist(searchTerm);

    if (searchResults.length === 0) {
      // Try searching without mbid prefix
      const fallbackResults = await searchArtist(musicBrainzId);
      if (fallbackResults.length === 0) {
        throw new Error("Artist not found in Lidarr lookup");
      }
    }

    const artistToAdd = searchResults[0];

    // Add the artist
    const response = await lidarrFetch("/artist", {
      method: "POST",
      body: JSON.stringify({
        ...artistToAdd,
        rootFolderPath,
        qualityProfileId,
        metadataProfileId,
        monitored: true,
        monitorNewItems: "all",
        addOptions: {
          monitor: "all",
          searchForMissingAlbums: true,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Failed to add artist: ${response.statusText}`
      );
    }

    return response.json();
  } catch (error) {
    console.error("Error adding to Lidarr:", error);
    throw error;
  }
}

// Get existing artists
export async function getArtists(): Promise<LidarrArtist[]> {
  const response = await lidarrFetch("/artist");

  if (!response.ok) {
    throw new Error(`Failed to get artists: ${response.statusText}`);
  }

  return response.json();
}

// Check if artist exists in Lidarr by MusicBrainz ID
export async function artistExistsInLidarr(
  musicBrainzId: string
): Promise<boolean> {
  try {
    const artists = await getArtists();
    return artists.some((artist) => artist.foreignArtistId === musicBrainzId);
  } catch {
    return false;
  }
}
