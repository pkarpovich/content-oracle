import { useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";

import { Routes } from "../constants/routes.ts";
import MenuIcon from "../icons/menu.svg";
import style from "./Header.module.css";
import { Logo } from "./Logo.tsx";
import { Typography } from "./Typography.tsx";

type HeaderProps = {
    onMenuClick: () => void;
};

export const Header = ({ onMenuClick }: HeaderProps) => {
    const navigate = useNavigate();

    const handleRouteClick = useCallback(async () => {
        await navigate({
            to: Routes.Root,
        });
    }, [navigate]);

    const handleRefresh = useCallback(() => {
        window.location.reload();
    }, []);

    return (
        <div className={style.headerContainer}>
            <button className={style.menu} onClick={onMenuClick} type="button">
                <MenuIcon />
            </button>
            <button className={style.appName} onClick={handleRouteClick} type="button">
                <Typography variant="h2">Content Oracle</Typography>
            </button>
            <div className={style.logo}>
                <Logo onClick={handleRefresh} />
            </div>
        </div>
    );
};
