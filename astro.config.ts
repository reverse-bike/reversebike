import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
const googleAnalyticsId = "G-YD683YP37S";

// https://astro.build/config
export default defineConfig({
  site: "https://www.reverse.bike",
  redirects: {
    "/components/electrical/additional-cablesadaptors":
      "/components/electrical/additional-cablesadapters",
  },
  integrations: [
    starlight({
      title: "Reverse Bike",
      favicon: "/rs73-square.png",
      logo: {
        src: "./src/assets/rs73.png",
      },
      head: [
        {
          tag: "meta",
          attrs: {
            property: "og:image",
            content: "https://www.reverse.bike/r73-og.jpg",
          },
        },
        // Adding google analytics
        {
          tag: "script",
          attrs: {
            src: `https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`,
          },
        },
        {
          tag: "script",
          content: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${googleAnalyticsId}');
                  `,
        },
      ],
      editLink: {
        baseUrl: "https://github.com/blopker/reversebike/edit/main/",
      },
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/reverse-bike/reversebike",
        },
      ],
      // Sidebar groups mirror the directory tree under src/content/docs.
      // Directory names double as group labels, so they are title-cased.
      sidebar: [
        "motivation",
        { label: "Components", items: [{ autogenerate: { directory: "Components", collapsed: true } }] },
        { label: "Teardowns", items: [{ autogenerate: { directory: "Teardowns" } }] },
        { label: "Specifications", items: [{ autogenerate: { directory: "Specifications", collapsed: true } }] },
        { label: "Software", items: [{ autogenerate: { directory: "Software" } }] },
        { label: "Diagnostics", items: [{ autogenerate: { directory: "Diagnostics" } }] },
        { label: "Mods", items: [{ autogenerate: { directory: "Mods" } }] },
      ],
    }),
  ],
});
