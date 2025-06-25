import { useNavigate, useRouterState } from "@tanstack/react-router";
import { clsx } from "clsx";
import { useCallback } from "react";

import { Routes } from "../constants/routes.ts";
import HistoryIcon from "../icons/history.svg";
import SettingsIcon from "../icons/settings.svg";
import style from "./Header.module.css";
import { Logo } from "./Logo.tsx";
import { Typography } from "./Typography.tsx";

export const Header = () => {
    const navigate = useNavigate();
    const state = useRouterState();

    const handleRouteClick = useCallback(
        (to: string) => async () => {
            await navigate({ to });
        },
        [navigate],
    );

    const handleRefresh = useCallback(() => {
        window.location.reload();
    }, []);

    return (
        <div className={style.headerContainer}>
            <button className={style.appName} onClick={handleRouteClick(Routes.Root)} type="button">
                <Typography variant="h2">Content Oracle</Typography>
            </button>
            
            <nav className={style.navigation}>
                <button
                    className={clsx(style.navTab, {
                        [style.active]: state.location.pathname === Routes.History,
                    })}
                    onClick={handleRouteClick(Routes.History)}
                    type="button"
                >
                    <HistoryIcon />
                    <span>History</span>
                </button>
                
                <button
                    className={clsx(style.navTab, {
                        [style.active]: state.location.pathname === Routes.Settings,
                    })}
                    onClick={handleRouteClick(Routes.Settings)}
                    type="button"
                >
                    <SettingsIcon />
                    <span>Settings</span>
                </button>
            </nav>

            <div className={style.logo}>
                <Logo onClick={handleRefresh} />
            </div>
        </div>
    );
};
