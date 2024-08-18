import { createLazyFileRoute } from "@tanstack/react-router";

import { Launchpad } from "../pages/Launchpad.tsx";

export const Route = createLazyFileRoute("/")({
    component: () => <Launchpad />,
});
