export const FOLDER_COLORS = [
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#f43f5e', // Rose
  '#f97316', // Orange
  '#eab308', // Yellow
  '#22c55e', // Green
  '#14b8a6', // Teal
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#a855f7', // Purple
  '#d946ef', // Fuchsia
  '#f59e0b', // Amber
  '#84cc16', // Lime
  '#10b981', // Emerald
  '#2dd4bf', // Teal
  '#0ea5e9', // Sky
  '#4f46e5', // Indigo Dark
  '#c026d3', // Magenta
  '#ea580c', // Burnt Orange
] as const;

export function getFolderColor(index: number): string {
  return FOLDER_COLORS[index % FOLDER_COLORS.length];
}
