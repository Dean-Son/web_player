export { defaultTheme, mergeTheme } from "./theme";
export type {
  PlaybackRate,
  PreviewImage,
  VideoPlayerEvents,
  VideoPlayerOptions,
  VideoPlayerState,
  VideoPlayerTheme,
} from "./types";
export {
  clamp,
  createPerformanceMonitor,
  debounce,
  EventListenerManager,
  formatTime,
  manageFocus,
  rafThrottle,
  safeQuerySelector,
  throttle,
} from "./utils";
export { VideoPlayer } from "./VideoPlayer";

// Export new modular architecture components (optional)
export { EventManager } from "./EventManager";
export { PreviewSystem } from "./PreviewSystem";
export { ThemeManager } from "./ThemeManager";
export { VideoPlayerControls } from "./VideoPlayerControls";
export { VideoPlayerUI } from "./VideoPlayerUI";
