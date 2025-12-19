import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import { generateSidebar } from "./sidebar.mjs";

const sidebar = await generateSidebar();
const googleAnalyticsId = "G-YD683YP37S";

// https://astro.build/config
export default defineConfig({
  site: "https://www.reverse.bike",
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
            content: "/rs73.png",
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
      sidebar,
    }),
  ],
});
