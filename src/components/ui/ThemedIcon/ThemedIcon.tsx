import { useTheme } from 'next-themes';

interface ThemedIconProps {
  light: string;
  dark: string;
  alt: string;
  className?: string;
}

export function ThemedIcon({ light, dark, alt, className = 'w-4 h-4' }: ThemedIconProps) {
  const { resolvedTheme } = useTheme();

  return <img src={resolvedTheme === 'dark' ? dark : light} alt={alt} className={className} />;
}
