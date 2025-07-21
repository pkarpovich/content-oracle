import { useEffect, useState, useCallback, useRef } from "react";
import { Popover } from "react-tiny-popover";
import { DayPicker, DateRange } from "react-day-picker";
import { Button } from "../../../components/Button.tsx";
import { Input } from "../../../components/Input.tsx";
import { Typography } from "../../../components/Typography.tsx";
import styles from "./FilterSidebar.module.css";
import "react-day-picker/style.css";

type FilterSidebarProps = {
    filters: FilterState;
    onFiltersChange?: (filters: FilterState) => void;
    isOpen?: boolean;
    onClose?: () => void;
    totalItems?: number;
};

export type FilterState = {
    status: string[];
    excluded_statuses: string[];
    excluded_video_ids: string[];
    is_subscribed?: boolean;
    min_ranking?: number;
    start_date?: Date;
    end_date?: Date;
    include_shorts?: boolean;
    include_blocked?: boolean;
    order_by?: string;
};

const STATUS_OPTIONS = [
    { value: "watched", label: "Watched" },
    { value: "", label: "Unwatched" },
    { value: "watching", label: "In Progress" },
    { value: "watch_later", label: "Watch Later" },
    { value: "skipped", label: "Skipped" },
];

const EXCLUDED_STATUS_OPTIONS = [
    { value: "", label: "Unwatched" },
    { value: "watched", label: "Watched" },
    { value: "blocked", label: "Blocked" },
    { value: "skipped", label: "Skipped" },
    { value: "watch_later", label: "Watch Later" },
];

const ORDER_BY_OPTIONS = [
    { value: "c.ranking DESC, v.published_at DESC", label: "Recommended (Top Channels + Newest)" },
    { value: "v.published_at DESC", label: "Newest Published" },
    { value: "v.published_at ASC", label: "Oldest Published" },
    { value: "v.updated_at DESC", label: "Recently Updated" },
    { value: "v.updated_at ASC", label: "Least Recently Updated" },
    { value: "c.ranking DESC", label: "Top Channels" },
    { value: "c.ranking ASC", label: "New/Low Ranked Channels" },
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

export const FilterSidebar = ({ filters, onFiltersChange, isOpen = true, onClose, totalItems }: FilterSidebarProps) => {
    const [showDatePicker, setShowDatePicker] = useState(false);

    const handleFilterChange = useCallback((key: keyof FilterState, value: any) => {
        const newFilters = { ...filters, [key]: value };
        onFiltersChange?.(newFilters);
    }, [filters, onFiltersChange]);

    const handleMultiSelectChange = useCallback((key: keyof FilterState, value: string, checked: boolean) => {
        const currentValues = filters[key] as string[];
        const newValues = checked
            ? [...currentValues, value]
            : currentValues.filter(v => v !== value);
        
        handleFilterChange(key, newValues);
    }, [filters, handleFilterChange]);

    const handleClearAll = useCallback(() => {
        const clearedFilters: FilterState = {
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
        };
        onFiltersChange?.(clearedFilters);
    }, [onFiltersChange]);

    const handleDateRangeSelect = useCallback((range: DateRange | undefined) => {
        onFiltersChange?.({
            ...filters,
            start_date: range?.from,
            end_date: range?.to
        });
    }, [filters, onFiltersChange]);

    const handleDatePickerToggle = useCallback(() => {
        setShowDatePicker(!showDatePicker);
    }, [showDatePicker]);

    const handlePopoverContentClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
    }, []);


    const handleSubscriptionChange = useCallback((value: boolean | undefined) => {
        handleFilterChange("is_subscribed", value);
    }, [handleFilterChange]);

    const handleShortsChange = useCallback((checked: boolean) => {
        handleFilterChange("include_shorts", checked ? false : undefined);
    }, [handleFilterChange]);

    const handleBlockedChange = useCallback((checked: boolean) => {
        handleFilterChange("include_blocked", checked ? true : undefined);
    }, [handleFilterChange]);

    const handleRankingChange = useCallback((value: string) => {
        handleFilterChange("min_ranking", value ? parseInt(value) : undefined);
    }, [handleFilterChange]);

    const handleOrderChange = useCallback((value: string | undefined) => {
        handleFilterChange("order_by", value);
    }, [handleFilterChange]);

    const handleOnClickOutside = useCallback(() => {
        setShowDatePicker(false);
    }, []);

    const hasActiveFilters = filters.status.length > 0 || 
        filters.excluded_statuses.length > 0 || 
        filters.excluded_video_ids.length > 0 || 
        filters.is_subscribed !== undefined || 
        filters.min_ranking !== undefined || 
        filters.start_date !== undefined || 
        filters.end_date !== undefined || 
        filters.include_shorts !== undefined || 
        filters.include_blocked !== undefined || 
        filters.order_by !== undefined;

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div className={styles.mobileOverlay} onClick={onClose} />
            )}
            
            <div className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}>
                <div className={styles.header}>
                    <div className={styles.headerContent}>
                        <Typography variant="h3">Filters</Typography>
                        {totalItems !== undefined && (
                            <Typography variant="text" className={styles.itemCount}>
                                {totalItems} items total
                            </Typography>
                        )}
                    </div>
                    <button className={styles.closeButton} onClick={onClose} type="button">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </button>
                </div>

                <div className={styles.content}>
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

                    <FilterSection title="Exclude Status">
                        <div className={styles.checkboxGroup}>
                            {EXCLUDED_STATUS_OPTIONS.map(option => (
                                <label key={option.value} className={styles.checkboxOption}>
                                    <input
                                        type="checkbox"
                                        checked={filters.excluded_statuses.includes(option.value)}
                                        onChange={(e) => handleMultiSelectChange("excluded_statuses", option.value, e.target.checked)}
                                    />
                                    <span>{option.label}</span>
                                </label>
                            ))}
                        </div>
                    </FilterSection>

                    <FilterSection title="Date Range">
                        <div className={styles.dateRangeInputs}>
                            <Popover
                                isOpen={showDatePicker}
                                positions={['left', 'right', 'bottom', 'top']}
                                padding={8}
                                containerStyle={{ zIndex: "9999" }}
                                clickOutsideCapture={true}
                                onClickOutside={handleOnClickOutside}
                                content={
                                    <div className={styles.datePickerPopover} onClick={handlePopoverContentClick}>
                                        <DayPicker
                                            mode="range"
                                            selected={{
                                                from: filters.start_date,
                                                to: filters.end_date,
                                            }}
                                            showOutsideDays={true}
                                            captionLayout="dropdown"
                                            onSelect={handleDateRangeSelect}
                                            className={styles.dayPicker}
                                        />
                                    </div>
                                }
                            >
                                <div className={styles.dateInputWrapper}>
                                    <div className={styles.dateRangeInputs}>
                                        <div className={styles.dateInputContainer} onClick={handleDatePickerToggle}>
                                            <Input
                                                placeholder="Start Date"
                                                value={filters.start_date ? filters.start_date.toLocaleDateString() : ""}
                                                readOnly={true}
                                                className={styles.dateInput}
                                            />
                                        </div>
                                        <span className={styles.dateSeparator}>-</span>
                                        <div className={styles.dateInputContainer} onClick={handleDatePickerToggle}>
                                            <Input
                                                placeholder="End Date"
                                                value={filters.end_date ? filters.end_date.toLocaleDateString() : ""}
                                                readOnly={true}
                                                className={styles.dateInput}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </Popover>
                        </div>
                    </FilterSection>

                    <FilterSection title="Subscription">
                        <div className={styles.radioGroup}>
                            <label className={styles.radioOption}>
                                <input
                                    type="radio"
                                    name="subscription"
                                    checked={filters.is_subscribed === undefined}
                                    onChange={() => handleSubscriptionChange(undefined)}
                                />
                                <span>All</span>
                            </label>
                            <label className={styles.radioOption}>
                                <input
                                    type="radio"
                                    name="subscription"
                                    checked={filters.is_subscribed === true}
                                    onChange={() => handleSubscriptionChange(true)}
                                />
                                <span>Subscribed Only</span>
                            </label>
                            <label className={styles.radioOption}>
                                <input
                                    type="radio"
                                    name="subscription"
                                    checked={filters.is_subscribed === false}
                                    onChange={() => handleSubscriptionChange(false)}
                                />
                                <span>Not Subscribed</span>
                            </label>
                        </div>
                    </FilterSection>

                    <FilterSection title="Content Options">
                        <div className={styles.checkboxGroup}>
                            <label className={styles.checkboxOption}>
                                <input
                                    type="checkbox"
                                    checked={filters.include_shorts === false}
                                    onChange={(e) => handleShortsChange(e.target.checked)}
                                />
                                <span>Exclude Shorts</span>
                            </label>
                            <label className={styles.checkboxOption}>
                                <input
                                    type="checkbox"
                                    checked={filters.include_blocked === true}
                                    onChange={(e) => handleBlockedChange(e.target.checked)}
                                />
                                <span>Include Blocked</span>
                            </label>
                        </div>
                    </FilterSection>

                    <FilterSection title="Minimum Ranking">
                        <div className={styles.sliderContainer}>
                            <input
                                type="range"
                                min="0"
                                max="10"
                                step="1"
                                value={filters.min_ranking ?? 0}
                                onChange={(e) => handleRankingChange(e.target.value)}
                                className={styles.slider}
                            />
                            <div className={styles.sliderValue}>
                                {filters.min_ranking ?? 0}
                            </div>
                        </div>
                    </FilterSection>

                    <FilterSection title="Sort Order">
                        <div className={styles.radioGroup}>
                            <label className={styles.radioOption}>
                                <input
                                    type="radio"
                                    name="order"
                                    checked={filters.order_by === undefined}
                                    onChange={() => handleOrderChange(undefined)}
                                />
                                <span>Default</span>
                            </label>
                            {ORDER_BY_OPTIONS.map(option => (
                                <label key={option.value} className={styles.radioOption}>
                                    <input
                                        type="radio"
                                        name="order"
                                        checked={filters.order_by === option.value}
                                        onChange={() => handleOrderChange(option.value)}
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