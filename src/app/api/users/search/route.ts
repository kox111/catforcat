import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  try {
    const { user, error } = await getAuthenticatedUser();
    if (error) return error;

    // Rate limit: 30/minute/user
    const rl = await checkRateLimit(`user-search:${user!.id}`, 30, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const q = req.nextUrl.searchParams.get("q")?.trim().toLowerCase();
    if (!q || q.length < 3) {
      return NextResponse.json({ users: [] });
    }

    const results = await prisma.user.findMany({
      where: {
        username: { contains: q, mode: "insensitive" },
        id: { not: user!.id },
      },
      select: {
        id: true,
        name: true,
        username: true,
        avatarUrl: true,
        plan: true,
      },
      take: 10,
    });

    return NextResponse.json({ users: results });
  } catch (err) {
    console.error("User search error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
