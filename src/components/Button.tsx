type ButtonProps = Readonly<{
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
}>;

export default function ThemeButton({ children, className, onClick }: ButtonProps) {
    return (
        <button className={"rounded-pill theme-button " + className} onClick={onClick}>
          {children}
        </button>
    );
}