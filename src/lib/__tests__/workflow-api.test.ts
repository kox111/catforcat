/**
 * Workflow Templates API — Unit tests with mocked Prisma + Auth
 * Run: npm test
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    workflowTemplate: {
      findMany: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock("@/lib/api-auth", () => ({
  getAuthenticatedUser: vi.fn(),
}));

import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { POST, GET } from "@/app/api/workflow-templates/route";

const mockUser = { id: "user-1", name: "Ana", email: "ana@test.com" };

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/workflow-templates", () => {
  it("returns defaults + user templates", async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue({ user: mockUser, error: null } as any);
    vi.mocked(prisma.workflowTemplate.findMany).mockResolvedValue([
      { id: "wt-1", name: "Simple", stages: '["translator","reviewer"]', isDefault: true, ownerId: null },
      { id: "wt-2", name: "My Custom", stages: '["translator","reviewer","proofreader"]', isDefault: false, ownerId: "user-1" },
    ] as any);

    const req = new NextRequest("http://localhost/api/workflow-templates");
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toHaveLength(2);
  });
});

describe("POST /api/workflow-templates", () => {
  it("creates custom template with valid stages", async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue({ user: mockUser, error: null } as any);
    vi.mocked(prisma.workflowTemplate.create).mockResolvedValue({
      id: "wt-3",
      name: "Full Pipeline",
      stages: '["translator","reviewer","proofreader","dtp"]',
      isDefault: false,
      ownerId: "user-1",
    } as any);

    const req = new NextRequest("http://localhost/api/workflow-templates", {
      method: "POST",
      body: JSON.stringify({
        name: "Full Pipeline",
        stages: ["translator", "reviewer", "proofreader", "dtp"],
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.name).toBe("Full Pipeline");
  });

  it("rejects stages with invalid roles", async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue({ user: mockUser, error: null } as any);

    const req = new NextRequest("http://localhost/api/workflow-templates", {
      method: "POST",
      body: JSON.stringify({
        name: "Bad",
        stages: ["translator", "invalid_role"],
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("rejects less than 2 stages", async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue({ user: mockUser, error: null } as any);

    const req = new NextRequest("http://localhost/api/workflow-templates", {
      method: "POST",
      body: JSON.stringify({
        name: "Too Short",
        stages: ["translator"],
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
