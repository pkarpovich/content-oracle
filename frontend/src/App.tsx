import styles from "./App.module.css";
import { ContentCard } from "./components/ContentCard.tsx";
import { useContent } from "./hooks/useContent.ts";

export const App = () => {
    const { content, error, loading } = useContent();

    return (
        <div className={styles.contentContainer}>
            {loading ? <p>Loading...</p> : null}
            {error ? <p>Error: {error.message}</p> : null}
            {content.map((item) => (
                <ContentCard imageUrl={item.thumbnail} key={item.id} title={item.title} url={item.url} />
            ))}
        </div>
    );
};
