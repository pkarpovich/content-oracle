import { Suspense } from "react";

import { PageLoader } from "../../../components/PageLoader.tsx";
import { ContentCategoryList } from "./ContentCategoryList.tsx";

export const Launchpad = () => (
    <Suspense fallback={<PageLoader />}>
        <ContentCategoryList />
    </Suspense>
);
