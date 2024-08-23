import type { Activity } from "../../../api/activity.ts";
import type { Category, Content } from "../../../api/content.ts";
import { ContentCard } from "./ContentCard.tsx";
import styles from "./ContentList.module.css";

type Props = {
    category: Category;
    content: Content[];
    onCheck: (activity: Activity) => void;
    onOpenUrl: (url: string) => void;
};

export const ContentList = ({ category, content, onCheck, onOpenUrl }: Props) => (
    <div className={styles.listContainer}>
        {content.map((item) => (
            <ContentCard
                category={category}
                id={item.id}
                imageUrl={item.thumbnail}
                isLive={item.isLive}
                key={item.id}
                onCheck={onCheck}
                onOpenUrl={onOpenUrl}
                position={item.position}
                title={item.title}
                url={item.url}
            />
        ))}
    </div>
);
