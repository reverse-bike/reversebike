import path from "node:path";
import { fileURLToPath } from "node:url";
import { readdir, readFile } from "node:fs/promises";
import type { StarlightUserConfig } from "@astrojs/starlight/types";

type Sidebar = NonNullable<StarlightUserConfig["sidebar"]>;
type SidebarItem = Sidebar[number];

type LinkItem = { label: string; slug: string };

/**
 * A directory containing only markdown files. Its items are spliced directly
 * into the parent group rather than nested under their own heading.
 */
type FlatNode = { kind: "flat"; label: string; items: LinkItem[] };

/** A directory with subdirectories. Rendered as a collapsible group. */
type GroupNode = {
  kind: "group";
  label: string;
  collapsed: boolean | undefined;
  items: SidebarItem[];
};

type DirectoryNode = FlatNode | GroupNode;

const formatSlugToTitle = (input: string): string => {
  if (!input) return input;

  // 1. Replace hyphens with spaces globally
  // 2. Match words (\w followed by non-whitespace \S*)
  // 3. Transform: First char upper, remainder lower
  return input
    .replace(/-/g, " ")
    .replace(
      /\w\S*/g,
      (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
    );
};

const DOCS_ROOT = fileURLToPath(new URL("./src/content/docs", import.meta.url));
const MARKDOWN_EXTENSIONS = new Set([".md", ".mdx"]);
const FRONTMATTER_REGEX = /^---\s*[\r\n]+([\s\S]*?)\r?\n---/;

const isMarkdownFile = (name: string): boolean =>
  MARKDOWN_EXTENSIONS.has(path.extname(name).toLowerCase());

const toPosixPath = (value: string): string =>
  value.split(path.sep).join("/");

const fileNameWithoutExtension = (name: string): string =>
  name.replace(/\.(md|mdx)$/i, "");

const buildSlug = (relativeDir: string, fileName: string): string => {
  const baseName = fileNameWithoutExtension(fileName);
  const segments: string[] = [];
  if (relativeDir) {
    segments.push(toPosixPath(relativeDir));
  }
  if (baseName !== "index") {
    segments.push(baseName);
  }
  const slug = segments.join("/");
  return slug || "index";
};

const createFileSidebarItem = (
  relativeDir: string,
  fileName: string,
  labelOverride?: string,
): LinkItem => {
  const baseName = fileNameWithoutExtension(fileName);
  let label = labelOverride ?? formatSlugToTitle(baseName);

  if (!labelOverride && baseName === "index" && relativeDir) {
    label = "Overview";
  }

  return {
    label,
    slug: buildSlug(relativeDir, fileName),
  };
};

const trimQuotes = (value: string): string =>
  value.replace(/^['"]/, "").replace(/['"]$/, "");

async function readFrontmatterTitle(filePath: string): Promise<string | null> {
  try {
    const content = await readFile(filePath, "utf8");
    const match = content.match(FRONTMATTER_REGEX);
    if (!match) {
      return null;
    }

    const frontmatter = match[1] ?? "";
    const lines = frontmatter.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const [key, ...rest] = trimmed.split(":");
      if (!key || rest.length === 0) continue;
      if (key.trim().toLowerCase() !== "title") continue;
      const value = rest.join(":").trim();
      return value ? trimQuotes(value) : null;
    }
    return null;
  } catch {
    return null;
  }
}

async function buildDirectoryNode(
  relativeDir: string,
  { isTopLevel = false }: { isTopLevel?: boolean } = {},
): Promise<DirectoryNode | null> {
  const absoluteDir = path.join(DOCS_ROOT, relativeDir);
  const dirents = await readdir(absoluteDir, { withFileTypes: true });

  const directories = dirents
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
  const markdownFiles = dirents
    .filter((entry) => entry.isFile() && isMarkdownFile(entry.name))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));

  const childNodes: DirectoryNode[] = [];
  for (const directoryName of directories) {
    const child = await buildDirectoryNode(
      path.join(relativeDir, directoryName),
      { isTopLevel: false },
    );
    if (child) {
      childNodes.push(child);
    }
  }

  if (!childNodes.length && !markdownFiles.length) {
    return null;
  }

  const relativeSegments = relativeDir.split(path.sep).filter(Boolean);
  const overviewFile = markdownFiles.find(
    (fileName) => fileNameWithoutExtension(fileName) === "index",
  );
  const overviewTitle = overviewFile
    ? await readFrontmatterTitle(path.join(absoluteDir, overviewFile))
    : null;
  const lastSegment = relativeSegments[relativeSegments.length - 1];
  const fallbackLabel =
    lastSegment !== undefined
      ? formatSlugToTitle(lastSegment)
      : formatSlugToTitle(relativeDir);
  const currentLabel = overviewTitle || fallbackLabel;
  const isLeafDirectory = childNodes.length === 0;

  const fileItems = markdownFiles.map((fileName) => {
    const isIndex = fileNameWithoutExtension(fileName) === "index";
    const labelOverride =
      isLeafDirectory && isIndex && currentLabel ? currentLabel : undefined;
    return createFileSidebarItem(relativeDir, fileName, labelOverride);
  });

  if (!childNodes.length) {
    return {
      kind: "flat",
      label: currentLabel,
      items: fileItems,
    };
  }

  const items: SidebarItem[] = [
    ...fileItems,
    ...childNodes.flatMap((child): SidebarItem[] =>
      child.kind === "flat"
        ? child.items
        : [
            {
              label: child.label,
              ...(child.collapsed ? { collapsed: child.collapsed } : {}),
              items: child.items,
            },
          ],
    ),
  ];

  return {
    kind: "group",
    label: currentLabel,
    collapsed: isTopLevel ? undefined : true,
    items,
  };
}

async function generateSidebar(): Promise<Sidebar> {
  const dirents = await readdir(DOCS_ROOT, { withFileTypes: true });
  const directories = dirents
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));

  const sections: Sidebar = [];
  for (const directoryName of directories) {
    const node = await buildDirectoryNode(directoryName, { isTopLevel: true });
    if (!node) continue;

    sections.push({
      label: node.label ?? formatSlugToTitle(directoryName),
      items: node.items,
    });
  }
  return sections;
}

export { generateSidebar };
