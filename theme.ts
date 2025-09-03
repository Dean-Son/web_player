import { VideoPlayerTheme } from "./types";

export const defaultTheme: VideoPlayerTheme = {
  primaryColor: "#007bff",
  secondaryColor: "#6c757d",
  backgroundColor: "#000000",
  textColor: "#ffffff",
  controlsBackground: "rgba(0, 0, 0, 0.7)",
  progressColor: "#007bff",
  progressBackgroundColor: "rgba(255, 255, 255, 0.3)",
  hoverColor: "#0056b3",
};

export function mergeTheme(customTheme?: VideoPlayerTheme): VideoPlayerTheme {
  return {
    ...defaultTheme,
    ...customTheme,
  };
}

export function applyTheme(
  element: HTMLElement,
  theme: VideoPlayerTheme
): void {
  const root = element.style;

  root.setProperty("--player-primary-color", theme.primaryColor!);
  root.setProperty("--player-secondary-color", theme.secondaryColor!);
  root.setProperty("--player-background-color", theme.backgroundColor!);
  root.setProperty("--player-text-color", theme.textColor!);
  root.setProperty("--player-controls-background", theme.controlsBackground!);
  root.setProperty("--player-progress-color", theme.progressColor!);
  root.setProperty(
    "--player-progress-background-color",
    theme.progressBackgroundColor!
  );
  root.setProperty("--player-hover-color", theme.hoverColor!);
}
