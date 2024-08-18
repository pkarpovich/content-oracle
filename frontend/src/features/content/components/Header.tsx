import { Logo } from "../../../components/Logo.tsx";
import { Typography } from "../../../components/Typography.tsx";
import style from "./Header.module.css";

export const Header = () => (
    <header className={style.headerContainer}>
        <div className={style.logo} />
        <Typography variant="h1">Content Oracle</Typography>
        <div className={style.logo}>
            <Logo />
        </div>
    </header>
);
