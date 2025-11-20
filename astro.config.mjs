import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import { generateSidebar } from "./sidebar.mjs";

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
    }),
  ],
});
