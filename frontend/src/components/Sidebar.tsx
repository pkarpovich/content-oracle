import { useNavigate, useRouterState } from "@tanstack/react-router";
import { clsx } from "clsx";
import { useCallback } from "react";

import { Routes } from "../constants/routes.ts";
import HistoryIcon from "../icons/history.svg";
import HomeIcon from "../icons/home.svg";
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
        (to: string) => async () => {
            onClose();
            await navigate({ to });
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
                        [style.active]: state.location.pathname === Routes.Root,
                    })}
                    onClick={handleRouteClick(Routes.Root)}
                    type="button"
                >
                    <HomeIcon />
                    <span>Home</span>
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
