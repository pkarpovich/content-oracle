import { memo, useCallback } from "react";
import type { Category, Content, CategoryMeta } from "../../../api/content.ts";
import { ContentCard } from "./ContentCard.tsx";
import { LoadMoreCard } from "./LoadMoreCard.tsx";
import { useLoadMoreContent } from "../api/useLoadMoreContent.ts";
import styles from "./ContentList.module.css";

type Props = {
    category: Category;
    content: Content[];
    onOpenUrl: (url: string) => void;
    meta?: CategoryMeta;
    onLoadMore?: () => void;
    isLoadingMore?: boolean;
};

export const ContentList = memo(({ category, content, onOpenUrl, meta, onLoadMore, isLoadingMore }: Props) => {
    const { mutate: loadMoreContent, isPending } = useLoadMoreContent();

    const hasMore = meta?.hasMore ?? false;
    const isLoading = isLoadingMore ?? isPending;

    const handleLoadMore = useCallback(() => {
        if (isLoading || !hasMore) return;

        if (onLoadMore) {
            onLoadMore();
        } else {
            loadMoreContent({
                category: category,
                currentCount: content.length
            });
        }
    }, [loadMoreContent, category, content.length, isLoading, hasMore, onLoadMore]);
    
    return (
        <div className={styles.listContainer}>
            {content.map((item) => (
                <ContentCard
                    artist={item.artist}
                    category={category}
                    id={item.id}
                    imageUrl={item.thumbnail}
                    isLive={item.isLive}
                    key={item.id}
                    onOpenUrl={onOpenUrl}
                    position={item.position}
                    title={item.title}
                    url={item.url}
                />
            ))}
            {hasMore && (
                <LoadMoreCard
                    key="load-more"
                    onClick={handleLoadMore}
                    isLoading={isLoading}
                />
            )}
        </div>
    );
});
