import { createLazyFileRoute } from "@tanstack/react-router";

import { Settings } from "../features/settings/components/Settings.tsx";

export const Route = createLazyFileRoute("/settings")({
    component: () => <Settings />,
});
