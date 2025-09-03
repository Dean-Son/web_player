export interface VideoPlayerOptions {
  container: HTMLElement | string;
  src: string;
  poster?: string;
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
  theme?: VideoPlayerTheme;
  previewImages?: PreviewImage[];
  generatePreview?: (time: number) => string; // 시간에 따른 미리보기 이미지 URL 생성 함수
  width?: string | number;
  height?: string | number;
  aspectRatio?: string; // e.g., "16:9", "4:3", "21:9"
}

export interface VideoPlayerTheme {
  primaryColor?: string;
  secondaryColor?: string;
  backgroundColor?: string;
  textColor?: string;
  controlsBackground?: string;
  progressColor?: string;
  progressBackgroundColor?: string;
  hoverColor?: string;
}

export interface PreviewImage {
  time: number; // seconds
  url: string;
}

export interface VideoPlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  playbackRate: number;
  isFullscreen: boolean;
  isMuted: boolean;
  isLoading: boolean;
}

export type PlaybackRate = 0.5 | 1 | 1.5 | 2;

export interface VideoPlayerEvents {
  play: () => void;
  pause: () => void;
  timeupdate: (currentTime: number) => void;
  durationchange: (duration: number) => void;
  volumechange: (volume: number) => void;
  ratechange: (rate: PlaybackRate) => void;
  fullscreenchange: (isFullscreen: boolean) => void;
  previewhover: (time: number) => void;
}
