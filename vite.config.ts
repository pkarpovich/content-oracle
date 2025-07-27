import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import webfontDownload from "vite-plugin-webfont-dl";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react(),
        TanStackRouterVite(),
        svgr({ include: "**/*.svg" }),
        webfontDownload(),
        VitePWA({
            registerType: "autoUpdate",
            manifest: {
                display: "standalone",
                orientation: "any",
                name: "Content Oracle",
                short_name: "Content Oracle",
                theme_color: "#323130",
                background_color: "#202322",
                icons: [
                    {
                        type: "image/x-icon",
                        src: "/favicon.ico",
                        sizes: "16x16 32x32",
                    },
                    {
                        src: "/apple-touch-icon.png",
                        sizes: "1024x1024",
                        type: "image/png",
                    },
                    {
                        src: "/apple-touch-icon.png",
                        sizes: "152x152",
                        type: "image/png",
                        purpose: "any maskable",
                    },
                    {
                        src: "/apple-touch-icon.png",
                        sizes: "167x167",
                        type: "image/png",
                        purpose: "any maskable",
                    },
                ],
            },
            workbox: {
                cleanupOutdatedCaches: true,
                navigateFallback: "/index.html",
                navigateFallbackDenylist: [/^\/auth\//, /^\/api\//],
            },
        }),
    ],
});
