import { ContentCategoryList } from "./ContentCategoryList.tsx";
import { Header } from "./Header.tsx";
import styles from "./Launchpad.module.css";

export const Launchpad = () => (
    <div className={styles.container}>
        <Header />
        <div className={styles.contentContainer}>
            <ContentCategoryList />
        </div>
    </div>
);
