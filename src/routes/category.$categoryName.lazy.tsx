import { createLazyFileRoute } from "@tanstack/react-router";

import { CategoryPage } from "../features/content/components/CategoryPage.tsx";

export const Route = createLazyFileRoute("/category/$categoryName")({
    component: () => <CategoryPage />,
});