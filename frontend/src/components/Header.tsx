import style from "./Header.module.css";
import { Logo } from "./Logo.tsx";
import { Typography } from "./Typography.tsx";

export const Header = () => (
    <header className={style.headerContainer}>
        <div className={style.logo} />
        <Typography variant="h1">Content Oracle</Typography>
        <div className={style.logo}>
            <Logo />
        </div>
    </header>
);
