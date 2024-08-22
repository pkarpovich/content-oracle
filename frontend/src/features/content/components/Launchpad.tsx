import { Suspense } from "react";

import { PageLoader } from "../../../components/PageLoader.tsx";
import { ContentCategoryList } from "./ContentCategoryList.tsx";
import styles from "./Launchpad.module.css";

export const Launchpad = () => (
    <div className={styles.container}>
        <Suspense fallback={<PageLoader />}>
            <ContentCategoryList />
        </Suspense>
    </div>
);
