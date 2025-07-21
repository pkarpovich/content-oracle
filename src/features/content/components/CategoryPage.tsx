import { useMemo, useState, useEffect } from "react";
import { useParams, Link } from "@tanstack/react-router";

import { Category, type GetContentByCategoryRequest, type QueryFilters } from "../../../api/content.ts";
import { Typography } from "../../../components/Typography.tsx";
import { Button } from "../../../components/Button.tsx";
import { useGetCategoryContent } from "../api/useGetCategoryContent.ts";
import { useOpenContent } from "../api/useOpenContent.ts";
import { ContentList } from "./ContentList.tsx";
import { FilterSidebar, type FilterState } from "./FilterSidebar.tsx";
import styles from "./CategoryPage.module.css";

export const CategoryPage = () => {
    const { categoryName } = useParams({ from: "/category/$categoryName" });
    const { mutate: openContent } = useOpenContent();
    const [isFilterOpen, setIsFilterOpen] = useState(false);
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

    const request: GetContentByCategoryRequest = useMemo(() => {
        const baseRequest: GetContentByCategoryRequest = {
            category: category || "",
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
    }, [category, filters]);

    const { data: response, error } = useGetCategoryContent(request);

    const content = response?.contentList || [];
    const appliedFilters = response?.appliedFilter;

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
        return {
            total: response.total,
            hasMore: response.offset + response.limit < response.total
        };
    }, [response]);

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
                />
            </div>
        </div>
    );
};