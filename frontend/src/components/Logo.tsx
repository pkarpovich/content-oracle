type Props = {
    onClick?: () => void;
};

export const Logo = ({ onClick }: Props) => (
    <picture onClick={onClick}>
        <source srcSet="https://fonts.gstatic.com/s/e/notoemoji/latest/1f422/512.webp" type="image/webp" />
        <img alt="🐢" height="32" src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f422/512.gif" width="32" />
    </picture>
);
