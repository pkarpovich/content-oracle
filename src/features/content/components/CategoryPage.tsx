import { useMemo, useState } from "react";
import { useParams, Link } from "@tanstack/react-router";

import { Category } from "../../../api/content.ts";
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
        search: "",
        duration: [],
        channel: [],
        contentType: [],
        date: "",
        status: [],
    });

    const category = useMemo(() => {
        return Object.values(Category).find(
            cat => cat.toLowerCase().replace(/\s+/g, "-") === categoryName
        );
    }, [categoryName]);

    const { data: allContent = [], error } = useGetCategoryContent(category || "", 50, 0);

    // Mock filtering logic - this would be replaced with actual filtering logic
    const filteredContent = useMemo(() => {
        let result = allContent;

        // Search filter
        if (filters.search) {
            result = result.filter(item => 
                item.title.toLowerCase().includes(filters.search.toLowerCase()) ||
                item.artist.name.toLowerCase().includes(filters.search.toLowerCase())
            );
        }

        // Channel filter
        if (filters.channel.length > 0) {
            result = result.filter(item => 
                filters.channel.some(channel => 
                    item.artist.name.toLowerCase().includes(channel.toLowerCase())
                )
            );
        }

        // Content type filter (mock logic)
        if (filters.contentType.length > 0) {
            result = result.filter(item => {
                if (filters.contentType.includes("live")) {
                    return item.isLive;
                }
                if (filters.contentType.includes("video")) {
                    return !item.isLive;
                }
                return true;
            });
        }

        // Other filters would be implemented here with real data
        // For now, they're just mock UI elements

        return result;
    }, [allContent, filters]);

    const meta = useMemo(() => {
        if (!filteredContent) return undefined;
        return {
            total: filteredContent.length,
            hasMore: allContent.length === 50 // If we got 50 items, there might be more
        };
    }, [filteredContent, allContent]);

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
                onFiltersChange={setFilters} 
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
            />
            
            <div className={styles.mainContent}>
                <div className={styles.navigation}>
                    <Link to="/" className={styles.breadcrumb}>
                        Home
                    </Link>
                    <span className={styles.breadcrumbSeparator}>›</span>
                    <span className={styles.breadcrumbCurrent}>{category}</span>
                </div>
                
                <div className={styles.header}>
                    <div className={styles.titleSection}>
                        <Typography variant="h1">{category}</Typography>
                        <Button
                            variant="contained"
                            size="small"
                            onClick={() => setIsFilterOpen(true)}
                            className={styles.filtersButton}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Filters
                        </Button>
                    </div>
                    <Typography className={styles.count} variant="text">
                        {filteredContent.length} items
                        {filteredContent.length !== allContent.length && (
                            <span className={styles.filteredCount}> (filtered from {allContent.length})</span>
                        )}
                    </Typography>
                </div>
                
                <ContentList
                    category={category}
                    content={filteredContent}
                    meta={meta}
                    onOpenUrl={openContent}
                />
            </div>
        </div>
    );
};