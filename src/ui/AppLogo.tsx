interface AppLogoProps {
  size?: number;
  className?: string;
}

export function AppLogo({ size = 24, className = "" }: AppLogoProps) {
  return (
    <img
      src={`${import.meta.env.BASE_URL}logo.png`}
      alt="Ruleon"
      width={size}
      height={size}
      className={`shrink-0 rounded-md object-cover ${className}`}
    />
  );
}
