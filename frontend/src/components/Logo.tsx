import styles from "./Logo.module.css";

type Props = {
    onClick?: () => void;
};

export const Logo = ({ onClick }: Props) => (
    <button onClick={onClick}>
        <img alt="🐢" className={styles.logo} src="/logo-animation.webp" />
    </button>
);
