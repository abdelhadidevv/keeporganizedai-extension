import { useTheme as useNextThemes } from 'next-themes';

function useTheme() {
  const { theme, setTheme, resolvedTheme } = useNextThemes();

  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  };

  const isDark = resolvedTheme === 'dark';

  return {
    theme: theme as string,
    setTheme,
    toggleTheme,
    isDark,
  };
}

export { useTheme };
export default useTheme;
