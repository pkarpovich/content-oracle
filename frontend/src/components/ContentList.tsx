import type { Content } from "../hooks/useContent.ts";
import { ContentCard } from "./ContentCard.tsx";
import styles from "./ContentList.module.css";

type Props = {
    content: Content[];
    onOpenUrl: (url: string) => void;
};

export const ContentList = ({ content, onOpenUrl }: Props) => (
    <div className={styles.listContainer}>
        {content.map((item) => (
            <ContentCard
                imageUrl={item.thumbnail}
                key={item.id}
                onOpenUrl={onOpenUrl}
                title={item.title}
                url={item.url}
            />
        ))}
    </div>
);
