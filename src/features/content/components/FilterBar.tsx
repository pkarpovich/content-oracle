import { useState } from "react";
import { Button } from "../../../components/Button.tsx";
import { Input } from "../../../components/Input.tsx";
import styles from "./FilterBar.module.css";

type FilterBarProps = {
    onFiltersChange?: (filters: FilterState) => void;
};

export type FilterState = {
    search: string;
    duration: string;
    channel: string;
    contentType: string;
    date: string;
    status: string;
};

const DURATION_OPTIONS = [
    { value: "", label: "All Durations" },
    { value: "short", label: "Short (<5min)" },
    { value: "medium", label: "Medium (5-30min)" },
    { value: "long", label: "Long (>30min)" },
];

const CONTENT_TYPE_OPTIONS = [
    { value: "", label: "All Types" },
    { value: "live", label: "Live Streams" },
    { value: "video", label: "Videos" },
    { value: "podcast", label: "Podcasts" },
];

const DATE_OPTIONS = [
    { value: "", label: "All Time" },
    { value: "today", label: "Today" },
    { value: "week", label: "This Week" },
    { value: "month", label: "This Month" },
    { value: "older", label: "Older" },
];

const STATUS_OPTIONS = [
    { value: "", label: "All Status" },
    { value: "watched", label: "Watched" },
    { value: "unwatched", label: "Unwatched" },
    { value: "in_progress", label: "In Progress" },
];

const CHANNEL_OPTIONS = [
    { value: "", label: "All Channels" },
    { value: "itbeard", label: "ITBeard" },
    { value: "dota_seconds", label: "Dota Seconds" },
    { value: "kd_cast", label: "KD CAST" },
    { value: "comment_show", label: "Коммент.Шоу" },
    { value: "ne_zanesli", label: "Не занесли" },
];

export const FilterBar = ({ onFiltersChange }: FilterBarProps) => {
    const [filters, setFilters] = useState<FilterState>({
        search: "",
        duration: "",
        channel: "",
        contentType: "",
        date: "",
        status: "",
    });

    const handleFilterChange = (key: keyof FilterState, value: string) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
        onFiltersChange?.(newFilters);
    };

    const handleClearAll = () => {
        const clearedFilters: FilterState = {
            search: "",
            duration: "",
            channel: "",
            contentType: "",
            date: "",
            status: "",
        };
        setFilters(clearedFilters);
        onFiltersChange?.(clearedFilters);
    };

    const hasActiveFilters = Object.values(filters).some(value => value !== "");

    return (
        <div className={styles.container}>
            <div className={styles.searchSection}>
                <Input
                    placeholder="Search content..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange("search", e.target.value)}
                    className={styles.searchInput}
                />
            </div>
            
            <div className={styles.filterSection}>
                <select
                    className={styles.filterSelect}
                    value={filters.date}
                    onChange={(e) => handleFilterChange("date", e.target.value)}
                >
                    {DATE_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>

                <select
                    className={styles.filterSelect}
                    value={filters.duration}
                    onChange={(e) => handleFilterChange("duration", e.target.value)}
                >
                    {DURATION_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>

                <select
                    className={styles.filterSelect}
                    value={filters.contentType}
                    onChange={(e) => handleFilterChange("contentType", e.target.value)}
                >
                    {CONTENT_TYPE_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>

                <select
                    className={styles.filterSelect}
                    value={filters.channel}
                    onChange={(e) => handleFilterChange("channel", e.target.value)}
                >
                    {CHANNEL_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>

                <select
                    className={styles.filterSelect}
                    value={filters.status}
                    onChange={(e) => handleFilterChange("status", e.target.value)}
                >
                    {STATUS_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>

                {hasActiveFilters && (
                    <Button
                        variant="secondary"
                        size="small"
                        onClick={handleClearAll}
                        className={styles.clearButton}
                    >
                        Clear All
                    </Button>
                )}
            </div>
        </div>
    );
};