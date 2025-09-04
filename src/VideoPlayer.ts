import { EventManager } from "./EventManager";
import { PreviewSystem } from "./PreviewSystem";
import "./styles.css";
import { ThemeManager } from "./ThemeManager";
import {
  PlaybackRate,
  PreviewImage,
  VideoPlayerEvents,
  VideoPlayerOptions,
  VideoPlayerState,
  VideoPlayerTheme,
} from "./types";
import { formatTime, rafThrottle } from "./utils";
import { VideoPlayerControls } from "./VideoPlayerControls";
import { UIElements, VideoPlayerUI } from "./VideoPlayerUI";

export class VideoPlayer {
  // Core modules
  private ui: VideoPlayerUI;
  private controls: VideoPlayerControls;
  private preview: PreviewSystem;
  private eventManager: EventManager;
  private themeManager: ThemeManager;

  // UI elements reference
  private elements: UIElements;

  // State
  private state: VideoPlayerState;

  // Container reference
  private container: HTMLElement;

  // Performance optimizations
  private cachedElements: {
    currentTimeElement?: Element | null;
    totalTimeElement?: Element | null;
    playOverlaySpan?: Element | null;
  } = {};
  private throttledUpdateUI: (...args: any[]) => void;

  constructor(options: VideoPlayerOptions) {
    // Validate container
    this.container =
      typeof options.container === "string"
        ? document.querySelector(options.container)!
        : options.container;

    if (!this.container) {
      throw new Error("Container element not found");
    }

    // Initialize state
    this.state = {
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      volume: 1,
      playbackRate: 1,
      isFullscreen: false,
      isMuted: options.muted || false,
      isLoading: false,
    };

    // Initialize core modules
    this.eventManager = new EventManager();
    this.ui = new VideoPlayerUI(this.container);
    this.themeManager = new ThemeManager(this.container, options.theme);

    // Create UI elements
    this.elements = this.ui.createElements();

    // Initialize other modules
    this.controls = new VideoPlayerControls(
      this.elements,
      this.state,
      this.eventManager
    );
    this.preview = new PreviewSystem(
      this.elements,
      this.eventManager,
      options.previewImages,
      options.generatePreview
    );

    // Setup everything
    this.setupVideo(options);
    this.ui.setupSize(options.width, options.height, options.aspectRatio);
    this.controls.setupEventListeners();
    this.preview.setupPreviewEvents();
    this.themeManager.applyTheme();

    // Setup performance optimizations
    this.throttledUpdateUI = rafThrottle(() => this.updateUI());
    this.cacheElements();

    // Setup state synchronization
    this.setupStateSync();

    // Create preview video after main video is ready
    if (this.elements.videoElement.readyState >= 1) {
      this.preview.createPreviewVideo(options.src);
    } else {
      this.elements.videoElement.addEventListener(
        "loadedmetadata",
        () => {
          this.preview.createPreviewVideo(options.src);
        },
        { once: true }
      );
    }
  }

  private setupVideo(options: VideoPlayerOptions): void {
    this.elements.videoElement.src = options.src;

    if (options.poster) {
      this.elements.videoElement.poster = options.poster;
    }

    if (options.autoplay) {
      this.elements.videoElement.autoplay = true;
    }

    if (options.muted) {
      this.elements.videoElement.muted = true;
    }

    if (options.loop) {
      this.elements.videoElement.loop = true;
    }

    this.elements.videoElement.volume = this.state.volume;
    this.elements.videoElement.playbackRate = this.state.playbackRate;
  }

  private cacheElements(): void {
    // Cache frequently accessed DOM elements
    this.cachedElements.currentTimeElement = this.elements.timeDisplay.querySelector(".current-time");
    this.cachedElements.totalTimeElement = this.elements.timeDisplay.querySelector(".total-time");
    this.cachedElements.playOverlaySpan = this.elements.playButtonOverlay.querySelector("span");
  }

  private setupStateSync(): void {
    // Listen to state changes - immediate update for play/pause, throttled for others
    this.eventManager.on("play", () => this.updatePlayButtonUI());
    this.eventManager.on("pause", () => this.updatePlayButtonUI());
    this.eventManager.on("timeupdate", () => this.throttledUpdateUI());
    this.eventManager.on("durationchange", () => this.throttledUpdateUI());
    this.eventManager.on("volumechange", () => this.throttledUpdateUI());
    this.eventManager.on("ratechange", () => this.throttledUpdateUI());
    this.eventManager.on("fullscreenchange", () => this.throttledUpdateUI());
  }

  private updatePlayButtonUI(): void {
    // 즉시 재생/일시정지 버튼 업데이트 (throttling 없음)
    const playText = this.state.isPlaying ? "⏸" : "▶";
    this.elements.playButton.textContent = playText;
    this.elements.playButton.setAttribute(
      "aria-pressed",
      this.state.isPlaying.toString()
    );
    this.elements.playButton.setAttribute(
      "aria-label",
      this.state.isPlaying ? "일시정지" : "재생"
    );

    // Use cached element for better performance
    if (this.cachedElements.playOverlaySpan) {
      this.cachedElements.playOverlaySpan.textContent = playText;
    }
    
    // 컨테이너 클래스도 즉시 업데이트
    this.container.classList.toggle("paused", !this.state.isPlaying);
  }

  private updateUI(): void {
    // 재생 버튼 업데이트
    this.updatePlayButtonUI();

    // Update progress bar with ARIA values
    const progressPercent =
      this.state.duration > 0
        ? (this.state.currentTime / this.state.duration) * 100
        : 0;
    const progressPercentRounded = Math.round(progressPercent);
    
    // Batch DOM updates to minimize reflow
    this.elements.progressFill.style.width = `${progressPercent}%`;
    this.elements.progressHandle.style.left = `${progressPercent}%`;
    this.elements.progressBar.setAttribute(
      "aria-valuenow",
      progressPercentRounded.toString()
    );
    this.elements.progressBar.setAttribute(
      "aria-valuetext",
      `${progressPercentRounded}% 완료`
    );

    // Update time display with cached elements
    if (this.cachedElements.currentTimeElement && this.cachedElements.totalTimeElement) {
      const currentTimeText = formatTime(this.state.currentTime);
      const totalTimeText = formatTime(this.state.duration);

      this.cachedElements.currentTimeElement.textContent = currentTimeText;
      this.cachedElements.totalTimeElement.textContent = totalTimeText;

      this.elements.timeDisplay.setAttribute(
        "aria-label",
        `재생 시간: ${currentTimeText} / ${totalTimeText}`
      );
    }

    // Update volume with ARIA values
    const volumePercent = Math.round(this.state.volume * 100);
    this.elements.volumeFill.style.width = `${volumePercent}%`;
    this.elements.volumeSlider.setAttribute(
      "aria-valuenow",
      volumePercent.toString()
    );
    this.elements.volumeSlider.setAttribute(
      "aria-valuetext",
      `볼륨 ${volumePercent}%`
    );

    // Update volume button
    const isMuted = this.state.isMuted || this.state.volume === 0;
    this.elements.volumeButton.textContent = isMuted
      ? "🔇"
      : this.state.volume < 0.5
      ? "🔉"
      : "🔊";
    this.elements.volumeButton.setAttribute("aria-pressed", isMuted.toString());
    this.elements.volumeButton.setAttribute(
      "aria-label",
      isMuted ? "음소거 해제" : "음소거"
    );

    // Update speed button with ARIA
    this.elements.speedButton.textContent = `${this.state.playbackRate}x`;
    this.elements.speedButton.setAttribute(
      "aria-label",
      `재생 속도: ${this.state.playbackRate}배`
    );

    // Update fullscreen button with ARIA
    this.elements.fullscreenButton.textContent = "⛶";
    this.elements.fullscreenButton.setAttribute(
      "aria-pressed",
      this.state.isFullscreen.toString()
    );
    this.elements.fullscreenButton.setAttribute(
      "aria-label",
      this.state.isFullscreen ? "전체화면 해제" : "전체화면"
    );
    
    // Batch class updates
    this.container.classList.toggle("fullscreen", this.state.isFullscreen);
  }

  // Public API methods
  public async play(): Promise<void> {
    await this.controls.play();
  }

  public pause(): void {
    this.controls.pause();
  }

  public togglePlay(): void {
    this.controls.togglePlay();
  }

  public setCurrentTime(time: number): void {
    this.controls.setCurrentTime(time);
  }

  public seek(seconds: number): void {
    this.controls.seek(seconds);
  }

  public setVolume(volume: number): void {
    this.controls.setVolume(volume);
  }

  public toggleMute(): void {
    this.controls.toggleMute();
  }

  public setPlaybackRate(rate: PlaybackRate): void {
    this.controls.setPlaybackRate(rate);
  }

  public toggleFullscreen(): void {
    this.controls.toggleFullscreen();
  }

  public updatePreviewImages(previewImages: PreviewImage[]): void {
    this.preview.updatePreviewImages(previewImages);
  }

  public setPreviewGenerator(generator: (time: number) => string): void {
    this.preview.setPreviewGenerator(generator);
  }

  public updateTheme(theme: VideoPlayerTheme): void {
    this.themeManager.updateTheme(theme);
  }

  public setSize(width?: string | number, height?: string | number): void {
    this.ui.setSize(width, height);
  }

  public setAspectRatio(aspectRatio: string): void {
    this.ui.setAspectRatio(aspectRatio);
  }

  public on<K extends keyof VideoPlayerEvents>(
    event: K,
    callback: VideoPlayerEvents[K]
  ): void {
    this.eventManager.on(event, callback);
  }

  public off<K extends keyof VideoPlayerEvents>(event: K): void {
    this.eventManager.off(event);
  }

  public getState(): VideoPlayerState {
    return { ...this.state };
  }

  public destroy(): void {
    // Cancel any pending RAF updates
    if (this.throttledUpdateUI && (this.throttledUpdateUI as any).cancel) {
      (this.throttledUpdateUI as any).cancel();
    }

    // Stop video
    this.elements.videoElement.pause();

    // Destroy all modules
    this.controls.destroy();
    this.preview.destroy();
    this.ui.destroy();
    this.eventManager.removeAllListeners();

    // Clear cached elements
    this.cachedElements = {};

    // Clear container
    this.container.innerHTML = "";
    this.container.className = "";
  }
}
