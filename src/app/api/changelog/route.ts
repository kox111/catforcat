import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export const revalidate = 3600; // revalidate every hour; file only changes on redeploy

interface ChangelogCategory {
  name: string;
  items: string[];
}

interface ChangelogVersion {
  version: string;
  date: string;
  categories: ChangelogCategory[];
}

interface ChangelogResponse {
  versions: ChangelogVersion[];
}

function parseChangelog(content: string): ChangelogResponse {
  const versions: ChangelogVersion[] = [];
  const lines = content.split("\n");

  let currentVersion: ChangelogVersion | null = null;
  let currentCategory: ChangelogCategory | null = null;

  for (const line of lines) {
    // Match version header: ## [1.0.0] - 2026-03-27
    const versionMatch = line.match(
      /^## \[([^\]]+)\]\s*-\s*(\d{4}-\d{2}-\d{2})/
    );
    if (versionMatch) {
      currentVersion = {
        version: versionMatch[1],
        date: versionMatch[2],
        categories: [],
      };
      versions.push(currentVersion);
      currentCategory = null;
      continue;
    }

    // Match category header: ### New, ### Fixed, ### Changed, etc.
    const categoryMatch = line.match(/^### (.+)/);
    if (categoryMatch && currentVersion) {
      currentCategory = {
        name: categoryMatch[1].trim(),
        items: [],
      };
      currentVersion.categories.push(currentCategory);
      continue;
    }

    // Match top-level list item: - Some item text
    // NOTE: indented sub-items (e.g. "  - sub") are not supported
    const itemMatch = line.match(/^- (.+)/);
    if (itemMatch && currentCategory) {
      currentCategory.items.push(itemMatch[1].trim());
    }
  }

  return { versions };
}

export async function GET(): Promise<NextResponse> {
  try {
    const changelogPath = path.join(process.cwd(), "CHANGELOG.md");
    const content = await fs.readFile(changelogPath, "utf-8");
    const parsed = parseChangelog(content);

    return NextResponse.json(parsed, {
      status: 200,
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      "code" in error &&
      (error as NodeJS.ErrnoException).code === "ENOENT"
    ) {
      return NextResponse.json(
        { error: "CHANGELOG.md not found" },
        {
          status: 404,
          headers: { "Cache-Control": "no-cache" },
        }
      );
    }

    const message =
      error instanceof Error ? error.message : "Failed to parse changelog";

    return NextResponse.json(
      { error: message },
      {
        status: 500,
        headers: { "Cache-Control": "no-cache" },
      }
    );
  }
}
