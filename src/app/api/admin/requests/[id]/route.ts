import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addArtistToLidarr } from "@/lib/lidarr";
import { z } from "zod";

const updateRequestSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED", "PROCESSING", "AVAILABLE"]),
  adminNote: z.string().optional(),
});

// Update request status (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const result = updateRequestSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { status, adminNote } = result.data;

    // Get the request
    const existingRequest = await prisma.request.findUnique({
      where: { id },
    });

    if (!existingRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    // If approving, try to add to Lidarr
    let lidarrId: number | null = null;
    if (status === "APPROVED") {
      try {
        const lidarrResult = await addArtistToLidarr(
          existingRequest.musicBrainzId,
          existingRequest.type
        );
        lidarrId = lidarrResult?.id || null;
      } catch (error) {
        console.error("Lidarr error:", error);
        // Continue even if Lidarr fails - we can retry later
      }
    }

    // Update the request
    const updatedRequest = await prisma.request.update({
      where: { id },
      data: {
        status,
        adminNote,
        ...(lidarrId && { lidarrId }),
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(updatedRequest);
  } catch (error) {
    console.error("Update request error:", error);
    return NextResponse.json(
      { error: "Failed to update request" },
      { status: 500 }
    );
  }
}

// Delete request (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await prisma.request.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete request error:", error);
    return NextResponse.json(
      { error: "Failed to delete request" },
      { status: 500 }
    );
  }
}
