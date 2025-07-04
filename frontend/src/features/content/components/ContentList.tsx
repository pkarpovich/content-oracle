import { memo, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
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

export const ContentList = memo(({ category, content, onCheck, onOpenUrl }: Props) => {
    const parentRef = useRef<HTMLDivElement>(null);
    
    const virtualizer = useVirtualizer({
        count: content.length,
        getScrollElement: () => parentRef.current?.parentElement || null,
        estimateSize: () => 240,
        overscan: 10,
    });
    
    return (
        <div ref={parentRef} className={styles.listContainer}>
            {virtualizer.getVirtualItems().map((virtualItem) => {
                const item = content[virtualItem.index];
                return (
                    <ContentCard
                        artist={item.artist}
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
                );
            })}
        </div>
    );
});
