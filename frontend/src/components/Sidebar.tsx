import { useNavigate, useRouterState } from "@tanstack/react-router";
import { clsx } from "clsx";
import { useCallback } from "react";

import { Category, categoryToHash } from "../api/content.ts";
import { Routes } from "../constants/routes.ts";
import HistoryIcon from "../icons/history.svg";
import HomeIcon from "../icons/home.svg";
import LightOnIcon from "../icons/light-on.svg";
import LiveIcon from "../icons/live.svg";
import PreviousIcon from "../icons/previous.svg";
import SettingsIcon from "../icons/settings.svg";
import style from "./Sidebar.module.css";

type SidebarProps = {
    isOpen: boolean;
    onClose: () => void;
};

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
    const state = useRouterState();
    const navigate = useNavigate();

    const handleRouteClick = useCallback(
        (to: string, hash?: string) => async () => {
            onClose();
            await navigate({
                hash,
                to,
            });
        },
        [navigate, onClose],
    );

    return (
        <div
            className={clsx(style.sidebarContainer, {
                [style.sidebarOpen]: isOpen,
            })}
        >
            <div className={style.innerContainer}>
                <button
                    className={clsx(style.icon, {
                        [style.active]:
                            state.location.pathname === Routes.Root &&
                            state.location.hash === categoryToHash(Category.liveStreams),
                    })}
                    onClick={handleRouteClick(Routes.Root, categoryToHash(Category.liveStreams))}
                    type="button"
                >
                    <HomeIcon />
                    <span>Home</span>
                </button>

                <button
                    className={clsx(style.icon, {
                        [style.active]:
                            state.location.pathname === Routes.Root &&
                            state.location.hash === categoryToHash(Category.liveStreams),
                    })}
                    onClick={handleRouteClick(Routes.Root, categoryToHash(Category.liveStreams))}
                    type="button"
                >
                    <LiveIcon />
                    <span>{Category.liveStreams}</span>
                </button>

                <button
                    className={clsx(style.icon, {
                        [style.active]:
                            state.location.pathname === Routes.Root &&
                            state.location.hash === categoryToHash(Category.youtubeHistory),
                    })}
                    onClick={handleRouteClick(Routes.Root, categoryToHash(Category.youtubeHistory))}
                    type="button"
                >
                    <PreviousIcon />
                    <span>{Category.youtubeHistory}</span>
                </button>

                <button
                    className={clsx(style.icon, {
                        [style.active]:
                            state.location.pathname === Routes.Root &&
                            state.location.hash === categoryToHash(Category.youTubeSuggestions),
                    })}
                    onClick={handleRouteClick(Routes.Root, categoryToHash(Category.youTubeSuggestions))}
                    type="button"
                >
                    <LightOnIcon />
                    <span>{Category.youTubeSuggestions}</span>
                </button>

                <button
                    className={clsx(style.icon, {
                        [style.active]: state.location.pathname === Routes.History,
                    })}
                    onClick={handleRouteClick(Routes.History)}
                    type="button"
                >
                    <HistoryIcon />
                    <span>History</span>
                </button>
            </div>
            <div className={style.innerContainer}>
                <button
                    className={clsx(style.icon, { [style.active]: state.location.pathname === Routes.Settings })}
                    onClick={handleRouteClick(Routes.Settings)}
                    type="button"
                >
                    <SettingsIcon />
                    <span>Settings</span>
                </button>
            </div>
        </div>
    );
};
