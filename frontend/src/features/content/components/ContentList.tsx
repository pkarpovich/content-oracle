import { memo, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { Activity } from "../../../api/activity.ts";
import type { Category, Content, CategoryMeta } from "../../../api/content.ts";
import { ContentCard } from "./ContentCard.tsx";
import { LoadMoreCard } from "./LoadMoreCard.tsx";
import styles from "./ContentList.module.css";

type Props = {
    category: Category;
    content: Content[];
    onCheck: (activity: Activity) => void;
    onOpenUrl: (url: string) => void;
    meta?: CategoryMeta;
};

export const ContentList = memo(({ category, content, onCheck, onOpenUrl, meta }: Props) => {
    const parentRef = useRef<HTMLDivElement>(null);
    
    const hasMore = meta?.hasMore ?? false;
    const totalCount = content.length + (hasMore ? 1 : 0);
    
    const virtualizer = useVirtualizer({
        count: totalCount,
        getScrollElement: () => parentRef.current?.parentElement || null,
        estimateSize: () => 240,
        overscan: 10,
    });
    
    return (
        <div ref={parentRef} className={styles.listContainer}>
            {virtualizer.getVirtualItems().map((virtualItem) => {
                if (virtualItem.index === content.length && hasMore) {
                    return <LoadMoreCard key="load-more" />;
                }
                
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
