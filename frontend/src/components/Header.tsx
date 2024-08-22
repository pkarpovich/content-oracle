import { useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";

import { Routes } from "../constants/routes.ts";
import style from "./Header.module.css";
import { Logo } from "./Logo.tsx";
import { Typography } from "./Typography.tsx";

export const Header = () => {
    const navigate = useNavigate();

    const handleRouteClick = useCallback(async () => {
        await navigate({
            to: Routes.Root,
        });
    }, [navigate]);

    return (
        <header className={style.headerContainer}>
            <div className={style.logo} />
            <button className={style.appName} onClick={handleRouteClick} type="button">
                <Typography variant="h2">Content Oracle</Typography>
            </button>
            <div className={style.logo}>
                <Logo />
            </div>
        </header>
    );
};
