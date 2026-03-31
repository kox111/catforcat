import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

// GET /api/notifications — list user notifications (paginated)
export async function GET(req: NextRequest) {
  try {
    const { user, error } = await getAuthenticatedUser();
    if (error) return error;

    const cursor = req.nextUrl.searchParams.get("cursor");
    const limit = Math.min(Number(req.nextUrl.searchParams.get("limit")) || 20, 50);

    const notifications = await prisma.notification.findMany({
      where: { userId: user!.id },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = notifications.length > limit;
    if (hasMore) notifications.pop();

    const unreadCount = await prisma.notification.count({
      where: { userId: user!.id, read: false },
    });

    return NextResponse.json({
      notifications,
      unreadCount,
      nextCursor: hasMore ? notifications[notifications.length - 1]?.id : null,
    });
  } catch (err) {
    console.error("List notifications error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
