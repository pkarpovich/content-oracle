import { ContentCategoryList } from "./ContentCategoryList.tsx";
import styles from "./Launchpad.module.css";

export const Launchpad = () => (
    <div className={styles.container}>
        <ContentCategoryList />
    </div>
);
