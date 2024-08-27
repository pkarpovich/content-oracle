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
                name: "Content Oracle",
                short_name: "Content Oracle",
                theme_color: "#2c2c2e",
                background_color: "#2c2c2e",
                icons: [
                    {
                        type: "image/icon",
                        src: "/favicon.ico",
                    },
                ],
            },
        }),
    ],
});
