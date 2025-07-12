import { createLazyFileRoute } from "@tanstack/react-router";

import { History } from "../features/history/components/History.tsx";

export const Route = createLazyFileRoute("/history")({
    component: () => <History />,
});
