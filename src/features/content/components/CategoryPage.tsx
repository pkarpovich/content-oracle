import { useMemo, useState, useEffect, useCallback } from "react";
import { useParams } from "@tanstack/react-router";

import { Category, type Content, type GetContentByCategoryRequest } from "../../../api/content.ts";
import { Typography } from "../../../components/Typography.tsx";
import { useGetCategoryContent } from "../api/useGetCategoryContent.ts";
import { useOpenContent } from "../api/useOpenContent.ts";
import { useLoadMoreContent } from "../api/useLoadMoreContent.ts";
import { ContentList } from "./ContentList.tsx";
import { FilterSidebar, type FilterState } from "./FilterSidebar.tsx";
import styles from "./CategoryPage.module.css";

export const CategoryPage = () => {
    const { categoryName } = useParams({ from: "/category/$categoryName" });
    const { mutate: openContent } = useOpenContent();
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [additionalContent, setAdditionalContent] = useState<Content[]>([]);
    const [localHasMore, setLocalHasMore] = useState<boolean | null>(null);
    const [filters, setFilters] = useState<FilterState>({
        status: [],
        excluded_statuses: [],
        excluded_video_ids: [],
        is_subscribed: undefined,
        min_ranking: undefined,
        start_date: undefined,
        end_date: undefined,
        include_shorts: undefined,
        include_blocked: undefined,
        order_by: undefined,
    });

    const category = useMemo(() => {
        return Object.values(Category).find(
            cat => cat.toLowerCase().replace(/\s+/g, "-") === categoryName
        );
    }, [categoryName]);

    const hasUserFilters = useMemo(() => {
        return filters.status.length > 0 || 
            filters.excluded_statuses.length > 0 || 
            filters.excluded_video_ids.length > 0 || 
            filters.is_subscribed !== undefined || 
            filters.min_ranking !== undefined || 
            filters.start_date !== undefined || 
            filters.end_date !== undefined || 
            filters.include_shorts !== undefined || 
            filters.include_blocked !== undefined || 
            filters.order_by !== undefined;
    }, [filters]);

    const request: GetContentByCategoryRequest = useMemo(() => {
        const baseRequest: GetContentByCategoryRequest = {
            category: hasUserFilters ? "Custom" : (category || ""),
            limit: 50,
            offset: 0,
            status: filters.status,
            excluded_statuses: filters.excluded_statuses,
            excluded_video_ids: filters.excluded_video_ids,
            is_subscribed: filters.is_subscribed,
            min_ranking: filters.min_ranking,
            start_date: filters.start_date ? `${filters.start_date.getFullYear()}-${String(filters.start_date.getMonth() + 1).padStart(2, '0')}-${String(filters.start_date.getDate()).padStart(2, '0')}` : undefined,
            end_date: filters.end_date ? `${filters.end_date.getFullYear()}-${String(filters.end_date.getMonth() + 1).padStart(2, '0')}-${String(filters.end_date.getDate()).padStart(2, '0')}` : undefined,
            include_shorts: filters.include_shorts,
            include_blocked: filters.include_blocked,
            order_by: filters.order_by,
        };

        if (baseRequest.include_shorts === undefined && (
            (baseRequest.status && baseRequest.status.length > 0) ||
            (baseRequest.excluded_statuses && baseRequest.excluded_statuses.length > 0) ||
            baseRequest.is_subscribed !== undefined ||
            baseRequest.min_ranking !== undefined ||
            baseRequest.start_date ||
            baseRequest.end_date ||
            baseRequest.order_by
        )) {
            baseRequest.include_shorts = false;
        }

        return baseRequest;
    }, [category, filters, hasUserFilters]);

    const { data: response, error } = useGetCategoryContent(request);
    const { mutate: loadMore, isPending: isLoadingMore } = useLoadMoreContent();

    const baseContent = response?.contentList || [];
    const content = useMemo(() => [...baseContent, ...additionalContent], [baseContent, additionalContent]);
    const appliedFilters = response?.appliedFilter;

    useEffect(() => {
        setAdditionalContent([]);
        setLocalHasMore(null);
    }, [request]);

    const handleLoadMore = useCallback(() => {
        loadMore(
            { category: category || "", currentCount: content.length, request },
            {
                onSuccess: (result) => {
                    setAdditionalContent(prev => [...prev, ...result.content]);
                    setLocalHasMore(result.hasMore);
                }
            }
        );
    }, [loadMore, category, content.length, request]);

    useEffect(() => {
        if (appliedFilters) {
            setFilters({
                status: appliedFilters.status || [],
                excluded_statuses: appliedFilters.excluded_statuses || [],
                excluded_video_ids: appliedFilters.excluded_video_ids || [],
                is_subscribed: appliedFilters.is_subscribed,
                min_ranking: appliedFilters.min_ranking,
                start_date: appliedFilters.start_date ? new Date(appliedFilters.start_date) : undefined,
                end_date: appliedFilters.end_date ? new Date(appliedFilters.end_date) : undefined,
                include_shorts: appliedFilters.include_shorts,
                include_blocked: appliedFilters.include_blocked,
                order_by: appliedFilters.order_by,
            });
        }
    }, [appliedFilters]);

    const meta = useMemo(() => {
        if (!response) return undefined;
        const baseHasMore = response.offset + response.limit < response.total;
        return {
            total: response.total,
            hasMore: localHasMore !== null ? localHasMore : baseHasMore
        };
    }, [response, localHasMore]);

    if (error) {
        return (
            <div className={styles.container}>
                <Typography variant="h1">Error</Typography>
                <Typography variant="text">{error.message}</Typography>
            </div>
        );
    }

    if (!category) {
        return (
            <div className={styles.container}>
                <Typography variant="h1">Category Not Found</Typography>
                <Typography variant="text">
                    The category "{categoryName}" does not exist.
                </Typography>
            </div>
        );
    }

    return (
        <div className={styles.pageContainer}>
            <FilterSidebar 
                filters={filters}
                onFiltersChange={setFilters} 
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                totalItems={response?.total || 0}
            />
            
            <div className={styles.mainContent}>
                
                <ContentList
                    category={category}
                    content={content}
                    meta={meta}
                    onOpenUrl={openContent}
                    onLoadMore={handleLoadMore}
                    isLoadingMore={isLoadingMore}
                />
            </div>
        </div>
    );
};