import { useNavigate, useRouterState } from "@tanstack/react-router";
import { clsx } from "clsx";
import { useCallback, useState } from "react";

import { Routes } from "../constants/routes.ts";
import HistoryIcon from "../icons/history.svg";
import SettingsIcon from "../icons/settings.svg";
import style from "./Header.module.css";
import { Logo } from "./Logo.tsx";
import { ThemeToggle } from "./ThemeToggle.tsx";
import { Typography } from "./Typography.tsx";

export const Header = () => {
    const navigate = useNavigate();
    const state = useRouterState();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleRouteClick = useCallback(
        (to: string) => async () => {
            await navigate({ to });
            setIsMenuOpen(false);
        },
        [navigate],
    );

    const handleRefresh = useCallback(() => {
        window.location.reload();
    }, []);

    const toggleMenu = useCallback(() => {
        setIsMenuOpen((prev) => !prev);
    }, []);

    return (
        <>
            <div className={style.backdrop} />
            <div className={style.backdropEdge} />
            <div className={style.headerContainer}>
                <div className={style.leftSection}>
                    <button className={style.appName} onClick={handleRouteClick(Routes.Root)} type="button">
                        <Typography variant="h2">Content Oracle</Typography>
                    </button>
                    <button aria-label="Toggle menu" className={style.menuButton} onClick={toggleMenu} type="button">
                        <div className={clsx(style.hamburger, { [style.open]: isMenuOpen })}>
                            <span />
                            <span />
                            <span />
                        </div>
                    </button>
                </div>

                <div className={style.logo}>
                    <ThemeToggle />
                    <Logo onClick={handleRefresh} />
                </div>

                {isMenuOpen ? (
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
                ) : null}
            </div>
        </>
    );
};
