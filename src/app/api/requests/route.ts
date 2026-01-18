import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createRequestSchema = z.object({
  musicBrainzId: z.string().min(1),
  type: z.enum(["ALBUM", "ARTIST"]),
  title: z.string().min(1),
  artistName: z.string().optional(),
  coverUrl: z.string().optional(),
});

// Create a new request
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const result = createRequestSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { musicBrainzId, type, title, artistName, coverUrl } = result.data;

    // Check if request already exists for this user
    const existingRequest = await prisma.request.findFirst({
      where: {
        musicBrainzId,
        userId: session.user.id,
      },
    });

    if (existingRequest) {
      return NextResponse.json(
        { error: "You have already requested this item" },
        { status: 400 }
      );
    }

    // Create the request
    const newRequest = await prisma.request.create({
      data: {
        musicBrainzId,
        type,
        title,
        artistName,
        coverUrl,
        userId: session.user.id,
      },
    });

    return NextResponse.json(newRequest, { status: 201 });
  } catch (error) {
    console.error("Create request error:", error);
    return NextResponse.json(
      { error: "Failed to create request" },
      { status: 500 }
    );
  }
}

// Get user's requests
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get("status");

  try {
    const requests = await prisma.request.findMany({
      where: {
        userId: session.user.id,
        ...(status && { status: status as "PENDING" | "APPROVED" | "REJECTED" | "PROCESSING" | "AVAILABLE" }),
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error("Get requests error:", error);
    return NextResponse.json(
      { error: "Failed to fetch requests" },
      { status: 500 }
    );
  }
}
