/**
 * Teams API — Unit tests with mocked Prisma + Auth
 * Tests the actual route handlers without a database.
 * Run: npm test
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock Prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    team: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    teamMember: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
  },
}));

// Mock Auth
vi.mock("@/lib/api-auth", () => ({
  getAuthenticatedUser: vi.fn(),
}));

import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { POST, GET } from "@/app/api/teams/route";

const mockUser = { id: "user-1", name: "Ana", email: "ana@test.com", username: "ana" };

beforeEach(() => {
  vi.clearAllMocks();
});

// ═══════════════════════════════════════════
// POST /api/teams — Create team
// ═══════════════════════════════════════════

describe("POST /api/teams", () => {
  it("creates a team with valid data", async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue({ user: mockUser, error: null } as any);
    vi.mocked(prisma.team.create).mockResolvedValue({
      id: "team-1",
      name: "Legal Team",
      description: null,
      ownerId: "user-1",
      createdAt: new Date(),
    } as any);
    vi.mocked(prisma.teamMember.create).mockResolvedValue({
      id: "tm-1",
      teamId: "team-1",
      userId: "user-1",
      role: "pm",
      color: "azul",
      joinedAt: new Date(),
    } as any);

    const req = new NextRequest("http://localhost/api/teams", {
      method: "POST",
      body: JSON.stringify({ name: "Legal Team" }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.team.name).toBe("Legal Team");
    expect(prisma.team.create).toHaveBeenCalledOnce();
    expect(prisma.teamMember.create).toHaveBeenCalledOnce();
  });

  it("rejects empty name", async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue({ user: mockUser, error: null } as any);

    const req = new NextRequest("http://localhost/api/teams", {
      method: "POST",
      body: JSON.stringify({ name: "" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("rejects unauthenticated user", async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue({
      user: null,
      error: new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }),
    } as any);

    const req = new NextRequest("http://localhost/api/teams", {
      method: "POST",
      body: JSON.stringify({ name: "Test" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });
});

// ═══════════════════════════════════════════
// GET /api/teams — List teams
// ═══════════════════════════════════════════

describe("GET /api/teams", () => {
  it("returns user's teams", async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue({ user: mockUser, error: null } as any);
    vi.mocked(prisma.teamMember.findMany).mockResolvedValue([
      {
        id: "tm-1",
        teamId: "team-1",
        userId: "user-1",
        role: "pm",
        color: "azul",
        joinedAt: new Date(),
        team: {
          id: "team-1",
          name: "Legal Team",
          description: null,
          ownerId: "user-1",
          createdAt: new Date(),
          _count: { members: 3, projects: 2 },
          owner: { id: "user-1", name: "Ana", username: "ana" },
        },
      },
    ] as any);

    const req = new NextRequest("http://localhost/api/teams");
    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.teams).toHaveLength(1);
    expect(data.teams[0].name).toBe("Legal Team");
    expect(data.teams[0].myRole).toBe("pm");
  });

  it("rejects unauthenticated user", async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue({
      user: null,
      error: new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }),
    } as any);

    const res = await GET();
    expect(res.status).toBe(401);
  });
});
