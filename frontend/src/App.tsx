import { Fragment } from "react";

import styles from "./App.module.css";
import { ContentList } from "./components/ContentList.tsx";
import { Header } from "./components/Header.tsx";
import { Typography } from "./components/Typography.tsx";
import { useContent } from "./hooks/useContent.ts";

export const App = () => {
    const { error, groupedContent, loading, openContent } = useContent();

    return (
        <div className={styles.container}>
            <Header />
            <div className={styles.contentContainer}>
                {loading ? <p>Loading...</p> : null}
                {error ? <p>Error: {error.message}</p> : null}
                {Array.from(groupedContent.entries()).map(([category, content]) => (
                    <Fragment key={category}>
                        <Typography variant="h2">{category}</Typography>
                        <ContentList content={content} key={category} onOpenUrl={openContent} />
                    </Fragment>
                ))}
            </div>
        </div>
    );
};
