import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react(),
        TanStackRouterVite(),
        svgr({ include: "**/*.svg" }),
        VitePWA({
            registerType: "autoUpdate",
            manifest: {
                display: "standalone",
                name: "Content Oracle",
                short_name: "Content Oracle",
                theme_color: "#ffbf00",
                background_color: "#2d5a73",
                icons: [
                    {
                        type: "image/icon",
                        src: "/favicon.ico",
                    },
                    {
                        src: "/apple-touch-icon.png",
                        sizes: "180x180",
                        type: "image/png",
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
