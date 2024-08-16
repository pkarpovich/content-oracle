import styles from "./App.module.css";
import { ContentList } from "./components/ContentList.tsx";
import { Header } from "./components/Header.tsx";
import { useContent } from "./hooks/useContent.ts";

export const App = () => {
    const { content, error, loading, openContent } = useContent();

    return (
        <div className={styles.container}>
            <Header />
            <div className={styles.contentContainer}>
                {loading ? <p>Loading...</p> : null}
                {error ? <p>Error: {error.message}</p> : null}
                <ContentList content={content} onOpenUrl={openContent} />
            </div>
        </div>
    );
};
