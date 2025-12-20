import { useEffect, useState, useCallback, useMemo } from "react";
import { Popover } from "react-tiny-popover";
import { DayPicker, DateRange } from "react-day-picker";
import { Button } from "../../../components/Button.tsx";
import { useGetSettings } from "../../settings/api/useGetSettings.ts";
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
    channel_ids: string[];
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
    hasActiveFilters?: boolean;
};

const FilterSection = ({ title, children, defaultOpen = true, hasActiveFilters = false }: FilterSectionProps) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    useEffect(() => {
        if (hasActiveFilters) {
            setIsOpen(true);
        }
    }, [hasActiveFilters]);

    return (
        <div className={`${styles.filterSection} ${hasActiveFilters ? styles.filterSectionActive : ''}`}>
            <button
                className={styles.sectionHeader}
                onClick={() => setIsOpen(!isOpen)}
                type="button"
            >
                <div className={styles.sectionTitleRow}>
                    <span className={styles.sectionTitle}>{title}</span>
                    {hasActiveFilters && <span className={styles.activeBadge} />}
                </div>
                <div className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
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
    const [channelSearch, setChannelSearch] = useState("");
    const { data: settings } = useGetSettings();

    const filteredChannels = useMemo(() => {
        if (!settings?.subscriptions) return [];
        if (!channelSearch.trim()) return settings.subscriptions;
        const search = channelSearch.toLowerCase();
        return settings.subscriptions.filter(channel =>
            channel.name.toLowerCase().includes(search)
        );
    }, [settings?.subscriptions, channelSearch]);

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
            channel_ids: [],
        };
        onFiltersChange?.(clearedFilters);
        setChannelSearch("");
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
        if (value === undefined) {
            const newFilters = {
                ...filters,
                is_subscribed: undefined,
                min_ranking: 0,
                order_by: "v.published_at DESC"
            };
            onFiltersChange?.(newFilters);
        } else {
            handleFilterChange("is_subscribed", value);
        }
    }, [filters, onFiltersChange, handleFilterChange]);

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

    const handleDatePreset = useCallback((preset: string) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        let start: Date | undefined;
        let end: Date | undefined = new Date();
        end.setHours(23, 59, 59, 999);

        switch (preset) {
            case 'today':
                start = today;
                break;
            case '7days':
                start = new Date(today);
                start.setDate(start.getDate() - 7);
                break;
            case '30days':
                start = new Date(today);
                start.setDate(start.getDate() - 30);
                break;
            case '90days':
                start = new Date(today);
                start.setDate(start.getDate() - 90);
                break;
            case 'year':
                start = new Date(today.getFullYear(), 0, 1);
                break;
            case 'clear':
                start = undefined;
                end = undefined;
                break;
        }

        onFiltersChange?.({
            ...filters,
            start_date: start,
            end_date: end
        });
    }, [filters, onFiltersChange]);

    const getActiveDatePreset = useCallback(() => {
        if (!filters.start_date) return null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const start = new Date(filters.start_date);
        start.setHours(0, 0, 0, 0);
        const diffDays = Math.round((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'today';
        if (diffDays === 7) return '7days';
        if (diffDays === 30) return '30days';
        if (diffDays === 90) return '90days';
        if (start.getMonth() === 0 && start.getDate() === 1 && start.getFullYear() === today.getFullYear()) return 'year';
        return 'custom';
    }, [filters.start_date]);

    const hasActiveFilters = filters.status.length > 0 ||
        filters.excluded_statuses.length > 0 ||
        filters.excluded_video_ids.length > 0 ||
        filters.is_subscribed !== undefined ||
        filters.min_ranking !== undefined ||
        filters.start_date !== undefined ||
        filters.end_date !== undefined ||
        filters.include_shorts !== undefined ||
        filters.include_blocked !== undefined ||
        filters.order_by !== undefined ||
        filters.channel_ids.length > 0;

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div className={styles.mobileOverlay} onClick={onClose} />
            )}
            
            <div className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}>
                <div className={styles.header}>
                    <div className={styles.headerContent}>
                        <span className={styles.headerTitle}>Filters</span>
                        {totalItems !== undefined && (
                            <span className={styles.itemCount}>
                                {totalItems.toLocaleString()} videos
                            </span>
                        )}
                    </div>
                    <button className={styles.closeButton} onClick={onClose} type="button">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </button>
                </div>

                <div className={styles.content}>
                    <FilterSection title="Watch Status" hasActiveFilters={filters.status.length > 0} defaultOpen={false}>
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

                    <FilterSection title="Exclude Status" hasActiveFilters={filters.excluded_statuses.length > 0} defaultOpen={false}>
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

                    <FilterSection title="Date Range" hasActiveFilters={filters.start_date !== undefined || filters.end_date !== undefined} defaultOpen={false}>
                        <div className={styles.datePresets}>
                            {[
                                { key: 'today', label: 'Today' },
                                { key: '7days', label: '7 days' },
                                { key: '30days', label: '30 days' },
                                { key: '90days', label: '90 days' },
                                { key: 'year', label: 'This year' },
                            ].map(preset => (
                                <button
                                    key={preset.key}
                                    type="button"
                                    className={`${styles.datePresetButton} ${getActiveDatePreset() === preset.key ? styles.datePresetActive : ''}`}
                                    onClick={() => handleDatePreset(preset.key)}
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>
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
                            <button
                                type="button"
                                className={`${styles.customDateButton} ${getActiveDatePreset() === 'custom' ? styles.customDateActive : ''}`}
                                onClick={handleDatePickerToggle}
                            >
                                {getActiveDatePreset() === 'custom' && filters.start_date && filters.end_date ? (
                                    <span className={styles.customDateRange}>
                                        {filters.start_date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        {' → '}
                                        {filters.end_date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </span>
                                ) : (
                                    <span>Custom range...</span>
                                )}
                            </button>
                        </Popover>
                    </FilterSection>

                    <FilterSection title="Subscription" hasActiveFilters={filters.is_subscribed !== undefined} defaultOpen={false}>
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

                    <FilterSection title="Channels" hasActiveFilters={filters.channel_ids.length > 0} defaultOpen={false}>
                        <div className={styles.channelFilter}>
                            <input
                                type="text"
                                placeholder="Search channels..."
                                value={channelSearch}
                                onChange={(e) => setChannelSearch(e.target.value)}
                                className={styles.channelSearchInput}
                            />
                            <div className={styles.channelList}>
                                {filteredChannels.map(channel => (
                                    <label key={channel.channelId} className={styles.checkboxOption}>
                                        <input
                                            type="checkbox"
                                            checked={filters.channel_ids.includes(channel.channelId)}
                                            onChange={(e) => handleMultiSelectChange("channel_ids", channel.channelId, e.target.checked)}
                                        />
                                        <span className={styles.channelName}>{channel.name}</span>
                                    </label>
                                ))}
                                {filteredChannels.length === 0 && channelSearch && (
                                    <div className={styles.noChannels}>No channels found</div>
                                )}
                            </div>
                        </div>
                    </FilterSection>

                    <FilterSection title="Content Options" hasActiveFilters={filters.include_shorts !== undefined || filters.include_blocked !== undefined} defaultOpen={false}>
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

                    <FilterSection title="Minimum Ranking" hasActiveFilters={filters.min_ranking !== undefined && filters.min_ranking > 0} defaultOpen={false}>
                        <div className={styles.sliderContainer}>
                            <div className={styles.sliderTrack}>
                                <input
                                    type="range"
                                    min="0"
                                    max="10"
                                    step="1"
                                    value={filters.min_ranking ?? 0}
                                    onChange={(e) => handleRankingChange(e.target.value)}
                                    className={styles.slider}
                                />
                            </div>
                            <div className={styles.sliderLabels}>
                                <span className={styles.sliderLabel}>0</span>
                                <span className={styles.sliderLabel}>5</span>
                                <span className={styles.sliderLabel}>10</span>
                            </div>
                            <div className={styles.sliderValue}>
                                <span className={styles.sliderValueNumber}>{filters.min_ranking ?? 0}</span>
                                <span className={styles.sliderValueLabel}>min rank</span>
                            </div>
                        </div>
                    </FilterSection>

                    <FilterSection title="Sort Order" hasActiveFilters={filters.order_by !== undefined} defaultOpen={false}>
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