import { applyTheme, mergeTheme } from "./theme";
import { VideoPlayerTheme } from "./types";

export class ThemeManager {
  private theme: VideoPlayerTheme;
  private container: HTMLElement;

  constructor(container: HTMLElement, customTheme?: VideoPlayerTheme) {
    this.container = container;
    this.theme = mergeTheme(customTheme);
  }

  public updateTheme(newTheme: VideoPlayerTheme): void {
    this.theme = mergeTheme(newTheme);
    this.applyTheme();
  }

  public applyTheme(): void {
    applyTheme(this.container, this.theme);
  }

  public getTheme(): VideoPlayerTheme {
    return { ...this.theme };
  }
}
