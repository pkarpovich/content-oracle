import { useState } from "react";
import { Button } from "../../../components/Button.tsx";
import { Input } from "../../../components/Input.tsx";
import { Typography } from "../../../components/Typography.tsx";
import styles from "./FilterSidebar.module.css";

type FilterSidebarProps = {
    onFiltersChange?: (filters: FilterState) => void;
    isOpen?: boolean;
    onClose?: () => void;
};

export type FilterState = {
    search: string;
    duration: string[];
    channel: string[];
    contentType: string[];
    date: string;
    status: string[];
};

const DURATION_OPTIONS = [
    { value: "short", label: "Short (<5min)" },
    { value: "medium", label: "Medium (5-30min)" },
    { value: "long", label: "Long (>30min)" },
];

const CONTENT_TYPE_OPTIONS = [
    { value: "live", label: "Live Streams" },
    { value: "video", label: "Videos" },
    { value: "podcast", label: "Podcasts" },
];

const DATE_OPTIONS = [
    { value: "today", label: "Today" },
    { value: "week", label: "This Week" },
    { value: "month", label: "This Month" },
    { value: "older", label: "Older" },
];

const STATUS_OPTIONS = [
    { value: "watched", label: "Watched" },
    { value: "unwatched", label: "Unwatched" },
    { value: "in_progress", label: "In Progress" },
];

const CHANNEL_OPTIONS = [
    { value: "itbeard", label: "ITBeard" },
    { value: "dota_seconds", label: "Dota Seconds" },
    { value: "kd_cast", label: "KD CAST" },
    { value: "comment_show", label: "Коммент.Шоу" },
    { value: "ne_zanesli", label: "Не занесли" },
    { value: "zhizn_malina", label: "жизнь-малина" },
    { value: "risa_za_tvorchestvo", label: "Риса за Творчество" },
];

type FilterSectionProps = {
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
};

const FilterSection = ({ title, children, defaultOpen = true }: FilterSectionProps) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className={styles.filterSection}>
            <button
                className={styles.sectionHeader}
                onClick={() => setIsOpen(!isOpen)}
                type="button"
            >
                <Typography variant="h4" className={styles.sectionTitle}>
                    {title}
                </Typography>
                <div className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </div>
            </button>
            {isOpen && (
                <div className={styles.sectionContent}>
                    {children}
                </div>
            )}
        </div>
    );
};

export const FilterSidebar = ({ onFiltersChange, isOpen = true, onClose }: FilterSidebarProps) => {
    const [filters, setFilters] = useState<FilterState>({
        search: "",
        duration: [],
        channel: [],
        contentType: [],
        date: "",
        status: [],
    });

    const handleFilterChange = (key: keyof FilterState, value: any) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
        onFiltersChange?.(newFilters);
    };

    const handleMultiSelectChange = (key: keyof FilterState, value: string, checked: boolean) => {
        const currentValues = filters[key] as string[];
        const newValues = checked
            ? [...currentValues, value]
            : currentValues.filter(v => v !== value);
        
        handleFilterChange(key, newValues);
    };

    const handleClearAll = () => {
        const clearedFilters: FilterState = {
            search: "",
            duration: [],
            channel: [],
            contentType: [],
            date: "",
            status: [],
        };
        setFilters(clearedFilters);
        onFiltersChange?.(clearedFilters);
    };

    const hasActiveFilters = filters.search !== "" || 
        filters.duration.length > 0 || 
        filters.channel.length > 0 || 
        filters.contentType.length > 0 || 
        filters.date !== "" || 
        filters.status.length > 0;

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div className={styles.mobileOverlay} onClick={onClose} />
            )}
            
            <div className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}>
                <div className={styles.header}>
                    <Typography variant="h3">Filters</Typography>
                    <button className={styles.closeButton} onClick={onClose} type="button">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </button>
                </div>

                <div className={styles.content}>
                    {/* Search */}
                    <FilterSection title="Search">
                        <Input
                            placeholder="Search content..."
                            value={filters.search}
                            onChange={(v) => handleFilterChange("search", v)}
                            className={styles.searchInput}
                        />
                    </FilterSection>

                    {/* Date */}
                    <FilterSection title="Date Added">
                        <div className={styles.radioGroup}>
                            <label className={styles.radioOption}>
                                <input
                                    type="radio"
                                    name="date"
                                    value=""
                                    checked={filters.date === ""}
                                    onChange={(e) => handleFilterChange("date", e.target.value)}
                                />
                                <span>All Time</span>
                            </label>
                            {DATE_OPTIONS.map(option => (
                                <label key={option.value} className={styles.radioOption}>
                                    <input
                                        type="radio"
                                        name="date"
                                        value={option.value}
                                        checked={filters.date === option.value}
                                        onChange={(e) => handleFilterChange("date", e.target.value)}
                                    />
                                    <span>{option.label}</span>
                                </label>
                            ))}
                        </div>
                    </FilterSection>

                    {/* Duration */}
                    <FilterSection title="Duration">
                        <div className={styles.checkboxGroup}>
                            {DURATION_OPTIONS.map(option => (
                                <label key={option.value} className={styles.checkboxOption}>
                                    <input
                                        type="checkbox"
                                        checked={filters.duration.includes(option.value)}
                                        onChange={(e) => handleMultiSelectChange("duration", option.value, e.target.checked)}
                                    />
                                    <span>{option.label}</span>
                                </label>
                            ))}
                        </div>
                    </FilterSection>

                    {/* Content Type */}
                    <FilterSection title="Content Type">
                        <div className={styles.checkboxGroup}>
                            {CONTENT_TYPE_OPTIONS.map(option => (
                                <label key={option.value} className={styles.checkboxOption}>
                                    <input
                                        type="checkbox"
                                        checked={filters.contentType.includes(option.value)}
                                        onChange={(e) => handleMultiSelectChange("contentType", option.value, e.target.checked)}
                                    />
                                    <span>{option.label}</span>
                                </label>
                            ))}
                        </div>
                    </FilterSection>

                    {/* Channel */}
                    <FilterSection title="Channel">
                        <div className={styles.checkboxGroup}>
                            {CHANNEL_OPTIONS.map(option => (
                                <label key={option.value} className={styles.checkboxOption}>
                                    <input
                                        type="checkbox"
                                        checked={filters.channel.includes(option.value)}
                                        onChange={(e) => handleMultiSelectChange("channel", option.value, e.target.checked)}
                                    />
                                    <span>{option.label}</span>
                                </label>
                            ))}
                        </div>
                    </FilterSection>

                    {/* Status */}
                    <FilterSection title="Watch Status">
                        <div className={styles.checkboxGroup}>
                            {STATUS_OPTIONS.map(option => (
                                <label key={option.value} className={styles.checkboxOption}>
                                    <input
                                        type="checkbox"
                                        checked={filters.status.includes(option.value)}
                                        onChange={(e) => handleMultiSelectChange("status", option.value, e.target.checked)}
                                    />
                                    <span>{option.label}</span>
                                </label>
                            ))}
                        </div>
                    </FilterSection>
                </div>

                {hasActiveFilters && (
                    <div className={styles.footer}>
                        <Button
                            variant="contained"
                            onClick={handleClearAll}
                            className={styles.clearButton}
                        >
                            Clear All Filters
                        </Button>
                    </div>
                )}
            </div>
        </>
    );
};