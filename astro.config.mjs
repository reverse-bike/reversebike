import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readdir } from "fs/promises";

const formatSlugToTitle = (input) => {
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

const isMarkdownFile = (name) =>
  MARKDOWN_EXTENSIONS.has(path.extname(name).toLowerCase());

const toPosixPath = (value) => value.split(path.sep).join("/");

const fileNameWithoutExtension = (name) => name.replace(/\.(md|mdx)$/i, "");

const buildSlug = (relativeDir, fileName) => {
  const baseName = fileNameWithoutExtension(fileName);
  const segments = [];
  if (relativeDir) {
    segments.push(toPosixPath(relativeDir));
  }
  if (baseName !== "index") {
    segments.push(baseName);
  }
  const slug = segments.join("/");
  return slug || "index";
};

const createFileSidebarItem = (relativeDir, fileName, labelOverride) => {
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

async function buildDirectoryNode(relativeDir) {
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

  const childNodes = [];
  for (const directoryName of directories) {
    const child = await buildDirectoryNode(
      path.join(relativeDir, directoryName),
    );
    if (child) {
      childNodes.push(child);
    }
  }

  if (!childNodes.length && !markdownFiles.length) {
    return null;
  }

  const relativeSegments = relativeDir.split(path.sep).filter(Boolean);
  const currentLabel =
    relativeSegments.length > 0
      ? formatSlugToTitle(relativeSegments[relativeSegments.length - 1])
      : formatSlugToTitle(relativeDir);
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
      items: fileItems,
    };
  }

  const items = [
    ...fileItems,
    ...childNodes.flatMap((child) =>
      child.kind === "flat"
        ? child.items
        : [
            {
              label: child.label,
              items: child.items,
            },
          ],
    ),
  ];

  return {
    kind: "group",
    label: currentLabel,
    items,
  };
}

async function generateSidebar() {
  const dirents = await readdir(DOCS_ROOT, { withFileTypes: true });
  const directories = dirents
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));

  const sections = [];
  for (const directoryName of directories) {
    const node = await buildDirectoryNode(directoryName);
    if (!node) continue;

    sections.push({
      label: formatSlugToTitle(directoryName),
      items: node.items,
    });
  }
  return sections;
}

const sidebar = await generateSidebar();

// https://astro.build/config
export default defineConfig({
  integrations: [
    starlight({
      title: "Reverse Bike",
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/withastro/starlight",
        },
      ],
      sidebar,
      // sidebar: [
      //   {
      //     label: "Guides",
      //     items: [
      //       // Each item here is one entry in the navigation menu.
      //       { label: "Example Guide", slug: "guides/example" },
      //     ],
      //   },
      //   {
      //     label: "Reference",
      //     autogenerate: { directory: "reference" },
      //   },
      // ],
    }),
  ],
});
