import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { testLidarrConnection, getRootFolders, getQualityProfiles, getMetadataProfiles } from "@/lib/lidarr";

// Get Lidarr settings
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const settings = await prisma.settings.findMany({
      where: {
        key: {
          startsWith: "lidarr_",
        },
      },
    });

    const settingsMap: Record<string, string> = {};
    settings.forEach((s) => {
      // Don't expose full API key
      if (s.key === "lidarr_api_key" && s.value) {
        settingsMap[s.key] = "••••••••" + s.value.slice(-4);
      } else {
        settingsMap[s.key] = s.value;
      }
    });

    return NextResponse.json(settingsMap);
  } catch (error) {
    console.error("Get settings error:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

// Save Lidarr settings
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { url, apiKey, rootFolder, qualityProfile, metadataProfile } = body;

    // Save URL
    if (url !== undefined) {
      await prisma.settings.upsert({
        where: { key: "lidarr_url" },
        update: { value: url },
        create: { key: "lidarr_url", value: url },
      });
    }

    // Save API key (only if not the masked version)
    if (apiKey !== undefined && !apiKey.startsWith("••••")) {
      await prisma.settings.upsert({
        where: { key: "lidarr_api_key" },
        update: { value: apiKey },
        create: { key: "lidarr_api_key", value: apiKey },
      });
    }

    // Save root folder
    if (rootFolder !== undefined) {
      await prisma.settings.upsert({
        where: { key: "lidarr_root_folder" },
        update: { value: rootFolder },
        create: { key: "lidarr_root_folder", value: rootFolder },
      });
    }

    // Save quality profile
    if (qualityProfile !== undefined) {
      await prisma.settings.upsert({
        where: { key: "lidarr_quality_profile" },
        update: { value: qualityProfile.toString() },
        create: { key: "lidarr_quality_profile", value: qualityProfile.toString() },
      });
    }

    // Save metadata profile
    if (metadataProfile !== undefined) {
      await prisma.settings.upsert({
        where: { key: "lidarr_metadata_profile" },
        update: { value: metadataProfile.toString() },
        create: { key: "lidarr_metadata_profile", value: metadataProfile.toString() },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Save settings error:", error);
    return NextResponse.json(
      { error: "Failed to save settings" },
      { status: 500 }
    );
  }
}

// Test Lidarr connection
export async function PUT() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await testLidarrConnection();

    if (result.success) {
      // If connection successful, also fetch available options
      const [rootFolders, qualityProfiles, metadataProfiles] = await Promise.all([
        getRootFolders().catch(() => []),
        getQualityProfiles().catch(() => []),
        getMetadataProfiles().catch(() => []),
      ]);

      return NextResponse.json({
        ...result,
        rootFolders,
        qualityProfiles,
        metadataProfiles,
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Test connection error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
