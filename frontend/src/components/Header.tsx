import style from "./Header.module.css";
import { Logo } from "./Logo.tsx";

export const Header = () => (
    <header className={style.headerContainer}>
        <div className={style.logo} />
        <h1>Content Oracle</h1>
        <div className={style.logo}>
            <Logo />
        </div>
    </header>
);
