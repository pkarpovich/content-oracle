import { useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";

import { Routes } from "../constants/routes.ts";
import HistoryIcon from "../icons/history.svg";
import HomeIcon from "../icons/home.svg";
import SettingsIcon from "../icons/settings.svg";
import style from "./Sidebar.module.css";

export const Sidebar = () => {
    const navigate = useNavigate();

    const handleRouteClick = useCallback(
        (to: string) => async () => {
            await navigate({
                to,
            });
        },
        [navigate],
    );

    return (
        <aside className={style.sidebarContainer}>
            <div className={style.innerContainer}>
                <button className={style.icon} onClick={handleRouteClick(Routes.Root)} type="button">
                    <HomeIcon />
                </button>

                <button className={style.icon} onClick={handleRouteClick(Routes.History)} type="button">
                    <HistoryIcon />
                </button>
            </div>
            <div className={style.innerContainer}>
                <button className={style.icon} onClick={handleRouteClick(Routes.Settings)} type="button">
                    <SettingsIcon />
                </button>
            </div>
        </aside>
    );
};
