import { createLazyFileRoute } from "@tanstack/react-router";

import { Settings } from "../pages/Settings.tsx";

export const Route = createLazyFileRoute("/settings")({
    component: () => <Settings />,
});
