import { createLazyFileRoute } from "@tanstack/react-router";

import { Launchpad } from "../features/content/components/Launchpad.tsx";

export const Route = createLazyFileRoute("/")({
    component: () => <Launchpad />,
});
