import "./styles.css";
import { applyTheme, mergeTheme } from "./theme";
import {
  PlaybackRate,
  PreviewImage,
  VideoPlayerEvents,
  VideoPlayerOptions,
  VideoPlayerState,
  VideoPlayerTheme,
} from "./types";
import { clamp, formatTime, throttle } from "./utils";

export class VideoPlayer {
  private container: HTMLElement;
  private videoElement!: HTMLVideoElement;
  private controlsElement!: HTMLElement;
  private progressBar!: HTMLElement;
  private progressFill!: HTMLElement;
  private progressHandle!: HTMLElement;
  private playButton!: HTMLElement;
  private playButtonOverlay!: HTMLElement;
  private timeDisplay!: HTMLElement;
  private volumeSlider!: HTMLElement;
  private volumeFill!: HTMLElement;
  private volumeButton!: HTMLElement;
  private speedButton!: HTMLElement;
  private speedMenu!: HTMLElement;
  private fullscreenButton!: HTMLElement;
  private loadingOverlay!: HTMLElement;
  private previewTooltip!: HTMLElement;
  private previewCanvas!: HTMLCanvasElement;
  private previewVideo!: HTMLVideoElement;

  private state: VideoPlayerState;
  private theme: VideoPlayerTheme;
  private previewImages: PreviewImage[];
  private generatePreview?: (time: number) => string;
  private events: Partial<VideoPlayerEvents>;

  private isDragging: boolean = false;
  private controlsTimeout: number | null = null;
  private isGeneratingPreview: boolean = false;

  constructor(options: VideoPlayerOptions) {
    this.container =
      typeof options.container === "string"
        ? document.querySelector(options.container)!
        : options.container;

    if (!this.container) {
      throw new Error("Container element not found");
    }

    this.theme = mergeTheme(options.theme);
    this.previewImages = options.previewImages || [];
    this.generatePreview = options.generatePreview;
    this.events = {};

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

    this.createElements();
    this.setupVideo(options);
    this.setupSize(options);
    this.setupEventListeners();
    this.applyTheme();
    this.updateUI();

    // 메인 비디오 로드 후 미리보기 비디오 생성
    if (this.videoElement.readyState >= 1) {
      this.createPreviewVideo();
    } else {
      this.videoElement.addEventListener(
        "loadedmetadata",
        () => {
          this.createPreviewVideo();
        },
        { once: true }
      );
    }
  }

  private createElements(): void {
    this.container.className = "dean-video-player";

    // 인라인 스타일을 추가하여 확실히 컨트롤이 보이도록 함
    const style = document.createElement("style");
    style.textContent = `
      .dean-video-player {
        position: relative;
        width: 100%;
        aspect-ratio: 16 / 9;
        background-color: var(--player-background-color, #000);
        border-radius: 8px;
        overflow: hidden;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        user-select: none;
      }
      
      .dean-video-player.custom-size {
        width: var(--player-width);
        height: var(--player-height);
        aspect-ratio: unset;
      }
      
      .dean-video-player video {
        width: 100%;
        height: 100%;
        object-fit: contain;
        background-color: var(--player-background-color, #000);
      }
      
      .dean-video-player .controls-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: transparent;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.3s ease;
        pointer-events: none;
      }
      
      .dean-video-player:hover .controls-overlay,
      .dean-video-player.paused .controls-overlay {
        opacity: 1;
        pointer-events: auto;
      }
      
      .dean-video-player .play-button-overlay {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        background: var(--player-controls-background, rgba(0, 0, 0, 0.7));
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--player-text-color, #fff);
        font-size: 32px;
        transition: all 0.3s ease;
      }
      
      .dean-video-player .play-button-overlay:hover {
        background: var(--player-primary-color, #007bff);
        transform: scale(1.1);
      }
      
      .dean-video-player .controls {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        background: var(--player-controls-background, rgba(0, 0, 0, 0.7));
        padding: 16px;
        opacity: 0;
        transform: translateY(10px);
        transition: all 0.3s ease;
        pointer-events: none;
      }
      
      .dean-video-player:hover .controls,
      .dean-video-player .controls:focus-within,
      .dean-video-player.paused .controls {
        opacity: 1;
        transform: translateY(0);
        pointer-events: auto;
      }
      
      .dean-video-player .progress-container {
        margin-bottom: 12px;
      }
      
      .dean-video-player .progress-bar {
        width: 100%;
        height: 6px;
        background: var(--player-progress-background-color, rgba(255, 255, 255, 0.3));
        border-radius: 3px;
        position: relative;
        cursor: pointer;
      }
      
      .dean-video-player .progress-fill {
        height: 100%;
        background: var(--player-progress-color, #007bff);
        border-radius: 3px;
        transition: width 0.1s ease;
      }
      
      .dean-video-player .controls-row {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      
      .dean-video-player .control-button {
        background: none;
        border: none;
        color: var(--player-text-color, #fff);
        font-size: 18px;
        padding: 8px;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 36px;
        height: 36px;
      }
      
      .dean-video-player .control-button:hover {
        background: var(--player-hover-color, #0056b3);
        transform: scale(1.1);
      }
      
      .dean-video-player .time-display {
        color: var(--player-text-color, #fff);
        font-size: 14px;
        font-weight: 500;
        white-space: nowrap;
      }
      
      .dean-video-player .volume-container {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .dean-video-player .volume-slider {
        width: 80px;
        height: 4px;
        background: var(--player-progress-background-color, rgba(255, 255, 255, 0.3));
        border-radius: 2px;
        position: relative;
        cursor: pointer;
      }
      
      .dean-video-player .volume-fill {
        height: 100%;
        background: var(--player-progress-color, #007bff);
        border-radius: 2px;
        transition: width 0.1s ease;
      }
      
      .dean-video-player .progress-bar:hover .progress-handle {
        opacity: 1;
      }
      
      .dean-video-player .preview-tooltip {
        position: absolute;
        bottom: 120%;
        transform: translateX(-50%);
        background: var(--player-controls-background, rgba(0, 0, 0, 0.9));
        border-radius: 8px;
        padding: 8px;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
        pointer-events: none;
        z-index: 1000;
      }
      
      .dean-video-player .preview-tooltip.visible {
        opacity: 1;
        visibility: visible;
      }
      
      .dean-video-player .preview-image {
        width: 160px;
        height: 90px;
        object-fit: cover;
        border-radius: 4px;
        display: block;
        margin-bottom: 4px;
      }
      
      .dean-video-player .preview-time {
        color: var(--player-text-color, #fff);
        font-size: 12px;
        text-align: center;
        font-weight: 500;
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;

    if (!document.head.querySelector("style[data-dean-player]")) {
      style.setAttribute("data-dean-player", "true");
      document.head.appendChild(style);
    }

    this.container.innerHTML = `
      <video></video>
      
      <div class="loading-overlay" style="
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
      ">
        <div class="loading-spinner" style="
          width: 40px; height: 40px;
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-top: 3px solid var(--player-primary-color, #007bff);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        "></div>
      </div>
      
      <div class="controls-overlay">
        <div class="play-button-overlay">
          <span>▶</span>
        </div>
      </div>
      
      <div class="controls">
        <div class="progress-container">
          <div class="progress-bar">
            <div class="progress-fill"></div>
            <div class="progress-handle" style="
              position: absolute;
              top: 50%;
              transform: translate(-50%, -50%);
              width: 16px; height: 16px;
              background: var(--player-progress-color, #007bff);
              border-radius: 50%;
              opacity: 0;
              transition: opacity 0.3s ease;
            "></div>
            <div class="preview-tooltip">
              <canvas class="preview-canvas" width="160" height="90" style="
                border-radius: 4px;
                display: none;
                margin-bottom: 4px;
                background: #000;
              "></canvas>
              <img class="preview-image" src="" alt="" style="
                display: none;
                width: 160px;
                height: 90px;
                border-radius: 4px;
                margin-bottom: 4px;
              ">
              <div class="preview-time">0:00</div>
            </div>
          </div>
        </div>
        
        <div class="controls-row">
          <button class="control-button play-button">▶</button>
          <button class="control-button backward-button">⏪</button>
          <button class="control-button forward-button">⏩</button>
          
          <div class="time-display">
            <span class="current-time">0:00</span> / <span class="total-time">0:00</span>
          </div>
          
          <div style="flex: 1;"></div>
          
          <div class="volume-container">
            <button class="control-button volume-button">🔊</button>
            <div class="volume-slider">
              <div class="volume-fill"></div>
            </div>
          </div>
          
          <div class="speed-selector" style="position: relative;">
            <button class="control-button speed-button">1x</button>
            <div class="speed-menu" style="
              position: absolute;
              bottom: 100%;
              right: 0;
              background: var(--player-controls-background, rgba(0, 0, 0, 0.7));
              border-radius: 4px;
              padding: 8px 0;
              margin-bottom: 8px;
              min-width: 80px;
              opacity: 0;
              visibility: hidden;
              transform: translateY(10px);
              transition: all 0.3s ease;
            ">
              <button class="speed-option" data-speed="0.5" style="
                display: block; width: 100%; background: none; border: none;
                color: var(--player-text-color, #fff); padding: 8px 16px;
                text-align: left; cursor: pointer; transition: background 0.3s ease;
              ">0.5x</button>
              <button class="speed-option active" data-speed="1" style="
                display: block; width: 100%; background: var(--player-primary-color, #007bff); border: none;
                color: var(--player-text-color, #fff); padding: 8px 16px;
                text-align: left; cursor: pointer; transition: background 0.3s ease;
              ">1x</button>
              <button class="speed-option" data-speed="1.5" style="
                display: block; width: 100%; background: none; border: none;
                color: var(--player-text-color, #fff); padding: 8px 16px;
                text-align: left; cursor: pointer; transition: background 0.3s ease;
              ">1.5x</button>
              <button class="speed-option" data-speed="2" style="
                display: block; width: 100%; background: none; border: none;
                color: var(--player-text-color, #fff); padding: 8px 16px;
                text-align: left; cursor: pointer; transition: background 0.3s ease;
              ">2x</button>
            </div>
          </div>
          
          <button class="control-button fullscreen-button">⛶</button>
        </div>
      </div>
    `;

    // Get element references
    this.videoElement = this.container.querySelector("video")!;
    this.controlsElement = this.container.querySelector(".controls")!;
    this.progressBar = this.container.querySelector(".progress-bar")!;
    this.progressFill = this.container.querySelector(".progress-fill")!;
    this.progressHandle = this.container.querySelector(".progress-handle")!;
    this.playButton = this.container.querySelector(".play-button")!;
    this.playButtonOverlay = this.container.querySelector(
      ".play-button-overlay"
    )!;
    this.timeDisplay = this.container.querySelector(".time-display")!;
    this.volumeSlider = this.container.querySelector(".volume-slider")!;
    this.volumeFill = this.container.querySelector(".volume-fill")!;
    this.volumeButton = this.container.querySelector(".volume-button")!;
    this.speedButton = this.container.querySelector(".speed-button")!;
    this.speedMenu = this.container.querySelector(".speed-menu")!;
    this.fullscreenButton = this.container.querySelector(".fullscreen-button")!;
    this.previewTooltip = this.container.querySelector(".preview-tooltip")!;
    this.previewCanvas = this.container.querySelector(".preview-canvas")!;
    this.loadingOverlay = this.container.querySelector(".loading-overlay")!;
  }

  private setupVideo(options: VideoPlayerOptions): void {
    this.videoElement.src = options.src;

    if (options.poster) {
      this.videoElement.poster = options.poster;
    }

    if (options.autoplay) {
      this.videoElement.autoplay = true;
    }

    if (options.muted) {
      this.videoElement.muted = true;
    }

    if (options.loop) {
      this.videoElement.loop = true;
    }

    this.videoElement.volume = this.state.volume;
    this.videoElement.playbackRate = this.state.playbackRate;
  }

  private createPreviewVideo(): void {
    // 미리보기용 숨겨진 비디오 엘리먼트 생성
    this.previewVideo = document.createElement("video");
    this.previewVideo.src = this.videoElement.src;
    this.previewVideo.style.display = "none";
    this.previewVideo.style.position = "absolute";
    this.previewVideo.style.top = "-9999px";
    this.previewVideo.muted = true;
    this.previewVideo.preload = "metadata";
    this.previewVideo.crossOrigin = "anonymous"; // CORS 지원
    this.previewVideo.playsInline = true; // 모바일 호환성

    console.log("createPreviewVideo:", this.previewVideo);
    document.body.appendChild(this.previewVideo);

    // 메타데이터 로드 완료 시 로그
    this.previewVideo.addEventListener("loadedmetadata", () => {
      console.log("previewVideo 메타데이터 로드 완료:", {
        duration: this.previewVideo.duration,
        videoWidth: this.previewVideo.videoWidth,
        videoHeight: this.previewVideo.videoHeight,
        readyState: this.previewVideo.readyState,
      });
    });
  }

  private setupSize(options: VideoPlayerOptions): void {
    if (options.width || options.height) {
      this.container.classList.add("custom-size");

      if (options.width) {
        const width =
          typeof options.width === "number"
            ? `${options.width}px`
            : options.width;
        this.container.style.setProperty("--player-width", width);
      }

      if (options.height) {
        const height =
          typeof options.height === "number"
            ? `${options.height}px`
            : options.height;
        this.container.style.setProperty("--player-height", height);
      }
    }

    if (options.aspectRatio) {
      this.container.style.aspectRatio = options.aspectRatio.replace(
        ":",
        " / "
      );
    }
  }

  private setupEventListeners(): void {
    // Video events
    this.videoElement.addEventListener("loadstart", () =>
      this.setLoading(true)
    );
    this.videoElement.addEventListener("canplay", () => this.setLoading(false));
    this.videoElement.addEventListener("waiting", () => this.setLoading(true));
    this.videoElement.addEventListener("playing", () => this.setLoading(false));

    this.videoElement.addEventListener("play", () => {
      this.state.isPlaying = true;
      this.updateUI();
      this.events.play?.();
    });

    this.videoElement.addEventListener("pause", () => {
      this.state.isPlaying = false;
      this.updateUI();
      this.events.pause?.();
    });

    this.videoElement.addEventListener(
      "timeupdate",
      throttle(() => {
        this.state.currentTime = this.videoElement.currentTime;
        this.updateUI();
        this.events.timeupdate?.(this.state.currentTime);
      }, 100)
    );

    this.videoElement.addEventListener("durationchange", () => {
      this.state.duration = this.videoElement.duration;
      this.updateUI();
      this.events.durationchange?.(this.state.duration);
    });

    this.videoElement.addEventListener("volumechange", () => {
      this.state.volume = this.videoElement.volume;
      this.state.isMuted = this.videoElement.muted;
      this.updateUI();
      this.events.volumechange?.(this.state.volume);
    });

    this.videoElement.addEventListener("ratechange", () => {
      this.state.playbackRate = this.videoElement.playbackRate as PlaybackRate;
      this.updateUI();
      this.events.ratechange?.(this.state.playbackRate as PlaybackRate);
    });

    // Control events
    this.playButton.addEventListener("click", () => this.togglePlay());
    this.playButtonOverlay.addEventListener("click", () => this.togglePlay());

    this.container
      .querySelector(".backward-button")!
      .addEventListener("click", () => this.seek(-10));
    this.container
      .querySelector(".forward-button")!
      .addEventListener("click", () => this.seek(10));

    this.volumeButton.addEventListener("click", () => this.toggleMute());
    this.fullscreenButton.addEventListener("click", () =>
      this.toggleFullscreen()
    );

    // Progress bar events
    this.setupProgressBarEvents();
    this.setupVolumeSliderEvents();
    this.setupSpeedMenuEvents();
    this.setupKeyboardEvents();
    this.setupFullscreenEvents();
  }

  private setupProgressBarEvents(): void {
    const handleProgressClick = (e: MouseEvent) => {
      const rect = this.progressBar.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      const time = percent * this.state.duration;
      this.setCurrentTime(time);
    };

    const handleProgressHover = (e: MouseEvent) => {
      const rect = this.progressBar.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      const time = percent * this.state.duration;

      this.showPreview(e.clientX - rect.left, time);
      this.events.previewhover?.(time);
    };

    this.progressBar.addEventListener("click", handleProgressClick);

    this.progressBar.addEventListener("mousemove", handleProgressHover);

    this.progressBar.addEventListener("mouseenter", () => {
      this.previewTooltip.classList.add("visible");
    });

    this.progressBar.addEventListener("mouseleave", () => {
      this.previewTooltip.classList.remove("visible");
    });

    let isDragging = false;

    this.progressBar.addEventListener("mousedown", (e) => {
      isDragging = true;
      handleProgressClick(e);
    });

    document.addEventListener("mousemove", (e) => {
      if (isDragging) {
        handleProgressClick(e);
      }
    });

    document.addEventListener("mouseup", () => {
      isDragging = false;
    });
  }

  private setupVolumeSliderEvents(): void {
    const handleVolumeClick = (e: MouseEvent) => {
      const rect = this.volumeSlider.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      this.setVolume(clamp(percent, 0, 1));
    };

    this.volumeSlider.addEventListener("click", handleVolumeClick);

    let isDragging = false;

    this.volumeSlider.addEventListener("mousedown", (e) => {
      isDragging = true;
      handleVolumeClick(e);
    });

    document.addEventListener("mousemove", (e) => {
      if (isDragging) {
        handleVolumeClick(e);
      }
    });

    document.addEventListener("mouseup", () => {
      isDragging = false;
    });
  }

  private setupSpeedMenuEvents(): void {
    // Speed selector hover effect
    const speedSelector = this.container.querySelector(".speed-selector")!;
    speedSelector.addEventListener("mouseenter", () => {
      this.speedMenu.style.opacity = "1";
      this.speedMenu.style.visibility = "visible";
      this.speedMenu.style.transform = "translateY(0)";
    });

    speedSelector.addEventListener("mouseleave", () => {
      this.speedMenu.style.opacity = "0";
      this.speedMenu.style.visibility = "hidden";
      this.speedMenu.style.transform = "translateY(10px)";
    });

    this.speedMenu.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains("speed-option")) {
        const speed = parseFloat(target.dataset.speed!) as PlaybackRate;
        this.setPlaybackRate(speed);

        // Update active state
        this.speedMenu.querySelectorAll(".speed-option").forEach((option) => {
          (option as HTMLElement).style.background = "none";
        });
        target.style.background = "var(--player-primary-color, #007bff)";
      }
    });
  }

  private showPreview(position: number, time: number): void {
    console.log("showPreview 호출:", { position, time });

    // 미리보기 툴팁 위치 설정
    this.previewTooltip.style.left = `${position}px`;

    // 시간 표시 업데이트
    const timeElement = this.previewTooltip.querySelector(".preview-time")!;
    timeElement.textContent = formatTime(time);

    // 실시간 프레임 캡처 시도
    this.generateFramePreview(time);
  }

  private async generateFramePreview(time: number): Promise<void> {
    console.log("generateFramePreview 호출:", {
      time,
      isGenerating: this.isGeneratingPreview,
      duration: this.state.duration,
      previewVideo: !!this.previewVideo,
      previewCanvas: !!this.previewCanvas,
    });

    if (this.isGeneratingPreview || time < 0 || time > this.state.duration) {
      console.log("generateFramePreview 스킵:", {
        isGenerating: this.isGeneratingPreview,
        invalidTime: time < 0 || time > this.state.duration,
      });
      return;
    }

    this.isGeneratingPreview = true;

    try {
      // 미리 준비된 이미지가 있는지 확인
      const staticPreview = this.findPreviewImage(time);
      const imageElement = this.previewTooltip.querySelector(
        ".preview-image"
      ) as HTMLImageElement;
      const canvasElement = this.previewCanvas;

      console.log("미리보기 요소 확인:", {
        staticPreview: !!staticPreview,
        imageElement: !!imageElement,
        canvasElement: !!canvasElement,
      });

      if (staticPreview) {
        // 정적 이미지 사용
        console.log("정적 이미지 사용:", staticPreview);
        imageElement.src = staticPreview;
        imageElement.style.display = "block";
        canvasElement.style.display = "none";
      } else {
        // 실시간 프레임 캡처
        console.log("실시간 프레임 캡처 시작");
        await this.captureVideoFrame(time);
        imageElement.style.display = "none";
        canvasElement.style.display = "block";
        console.log("실시간 프레임 캡처 완료");
      }
    } catch (error) {
      console.warn("프레임 캡처 실패:", error);
      // 기본 이미지 또는 빈 상태로 표시
      const imageElement = this.previewTooltip.querySelector(
        ".preview-image"
      ) as HTMLImageElement;
      imageElement.style.display = "none";
      this.previewCanvas.style.display = "none";
    } finally {
      this.isGeneratingPreview = false;
    }
  }

  private async captureVideoFrame(time: number): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log("captureVideoFrame 시작:", {
        time,
        previewVideoReady: this.previewVideo?.readyState,
        previewVideoSrc: this.previewVideo?.src,
        mainVideoReady: this.videoElement?.readyState,
      });

      // 비디오가 로드되지 않았으면 대기
      if (this.previewVideo.readyState < 1) {
        console.log("previewVideo 로딩 대기...");
        const onLoadedMetadata = () => {
          this.previewVideo.removeEventListener(
            "loadedmetadata",
            onLoadedMetadata
          );
          this.captureVideoFrame(time).then(resolve).catch(reject);
        };
        this.previewVideo.addEventListener("loadedmetadata", onLoadedMetadata);
        return;
      }

      // 현재 재생 상태 저장
      const originalTime = this.videoElement.currentTime;
      const wasPlaying = !this.videoElement.paused;

      // seeked 이벤트 리스너 설정
      const onSeeked = () => {
        console.log("onSeeked 이벤트 발생:", this.previewVideo.currentTime);
        try {
          // Canvas에 현재 프레임 그리기
          const ctx = this.previewCanvas.getContext("2d");
          if (
            ctx &&
            this.previewVideo.videoWidth > 0 &&
            this.previewVideo.videoHeight > 0
          ) {
            console.log("Canvas에 프레임 그리기:", {
              videoWidth: this.previewVideo.videoWidth,
              videoHeight: this.previewVideo.videoHeight,
              canvasWidth: this.previewCanvas.width,
              canvasHeight: this.previewCanvas.height,
            });
            ctx.drawImage(this.previewVideo, 0, 0, 160, 90);
          } else {
            console.warn("Canvas context 또는 비디오 크기 문제:", {
              ctx: !!ctx,
              videoWidth: this.previewVideo.videoWidth,
              videoHeight: this.previewVideo.videoHeight,
            });
          }

          // 원래 상태로 복원
          this.previewVideo.currentTime = originalTime;

          this.previewVideo.removeEventListener("seeked", onSeeked);
          resolve();
        } catch (error) {
          console.error("Canvas 그리기 실패:", error);
          this.previewVideo.removeEventListener("seeked", onSeeked);
          reject(error);
        }
      };

      // 에러 핸들러
      const onError = (errorEvent: Event) => {
        console.error("previewVideo 에러:", errorEvent);
        this.previewVideo.removeEventListener("seeked", onSeeked);
        this.previewVideo.removeEventListener("error", onError);
        reject(new Error("비디오 seek 실패"));
      };

      // 타임아웃 핸들러 (3초 후 포기)
      const timeout = setTimeout(() => {
        console.warn("프레임 캡처 타임아웃");
        this.previewVideo.removeEventListener("seeked", onSeeked);
        this.previewVideo.removeEventListener("error", onError);
        reject(new Error("프레임 캡처 타임아웃"));
      }, 3000);

      this.previewVideo.addEventListener(
        "seeked",
        () => {
          clearTimeout(timeout);
          onSeeked();
        },
        { once: true }
      );
      this.previewVideo.addEventListener(
        "error",
        (e) => {
          clearTimeout(timeout);
          onError(e);
        },
        { once: true }
      );

      // 해당 시간으로 이동
      console.log("seek to time:", time);
      this.previewVideo.currentTime = time;
    });
  }

  private findPreviewImage(time: number): string | null {
    // generatePreview 함수가 있으면 우선 사용
    if (this.generatePreview) {
      return this.generatePreview(time);
    }

    // previewImages 배열에서 정확히 일치하거나 매우 가까운 시간의 이미지만 찾기
    if (this.previewImages.length > 0) {
      const threshold = 2; // 2초 이내의 차이만 허용

      for (const image of this.previewImages) {
        const diff = Math.abs(time - image.time);
        if (diff <= threshold) {
          console.log(
            `정적 이미지 사용: 시간 ${time}초 -> 이미지 ${image.time}초 (차이: ${diff}초)`
          );
          return image.url;
        }
      }

      console.log(`실시간 캡처 사용: 시간 ${time}초 (정적 이미지 없음)`);
    }

    return null;
  }

  private setupKeyboardEvents(): void {
    this.container.addEventListener("keydown", (e) => {
      switch (e.code) {
        case "Space":
          e.preventDefault();
          this.togglePlay();
          break;
        case "ArrowLeft":
          e.preventDefault();
          this.seek(-10);
          break;
        case "ArrowRight":
          e.preventDefault();
          this.seek(10);
          break;
        case "ArrowUp":
          e.preventDefault();
          this.setVolume(clamp(this.state.volume + 0.1, 0, 1));
          break;
        case "ArrowDown":
          e.preventDefault();
          this.setVolume(clamp(this.state.volume - 0.1, 0, 1));
          break;
        case "KeyM":
          e.preventDefault();
          this.toggleMute();
          break;
        case "KeyF":
          e.preventDefault();
          this.toggleFullscreen();
          break;
      }
    });

    this.container.tabIndex = 0; // Make container focusable
  }

  private setupFullscreenEvents(): void {
    document.addEventListener("fullscreenchange", () => {
      this.state.isFullscreen = !!document.fullscreenElement;
      this.updateUI();
      this.events.fullscreenchange?.(this.state.isFullscreen);
    });
  }

  private applyTheme(): void {
    applyTheme(this.container, this.theme);
  }

  private setLoading(loading: boolean): void {
    this.state.isLoading = loading;
    this.loadingOverlay.classList.toggle("visible", loading);
  }

  private updateUI(): void {
    // Update play button
    this.playButton.textContent = this.state.isPlaying ? "⏸" : "▶";
    this.playButtonOverlay.querySelector("span")!.textContent = this.state
      .isPlaying
      ? "⏸"
      : "▶";

    // Update progress bar
    const progressPercent =
      this.state.duration > 0
        ? (this.state.currentTime / this.state.duration) * 100
        : 0;
    this.progressFill.style.width = `${progressPercent}%`;
    this.progressHandle.style.left = `${progressPercent}%`;

    // Update time display
    const currentTimeElement = this.timeDisplay.querySelector(".current-time")!;
    const totalTimeElement = this.timeDisplay.querySelector(".total-time")!;
    currentTimeElement.textContent = formatTime(this.state.currentTime);
    totalTimeElement.textContent = formatTime(this.state.duration);

    // Update volume
    this.volumeFill.style.width = `${this.state.volume * 100}%`;
    this.volumeButton.textContent =
      this.state.isMuted || this.state.volume === 0
        ? "🔇"
        : this.state.volume < 0.5
        ? "🔉"
        : "🔊";

    // Update speed button
    this.speedButton.textContent = `${this.state.playbackRate}x`;

    // Update fullscreen button
    this.fullscreenButton.textContent = this.state.isFullscreen ? "⛶" : "⛶";
    this.container.classList.toggle("fullscreen", this.state.isFullscreen);

    // Update paused state for controls visibility
    this.container.classList.toggle("paused", !this.state.isPlaying);
  }

  // Public API methods
  public play(): void {
    this.videoElement.play();
  }

  public pause(): void {
    this.videoElement.pause();
  }

  public togglePlay(): void {
    if (this.state.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  public setCurrentTime(time: number): void {
    this.videoElement.currentTime = clamp(time, 0, this.state.duration);
  }

  public seek(seconds: number): void {
    this.setCurrentTime(this.state.currentTime + seconds);
  }

  public setVolume(volume: number): void {
    this.videoElement.volume = clamp(volume, 0, 1);
    if (volume > 0) {
      this.videoElement.muted = false;
    }
  }

  public toggleMute(): void {
    this.videoElement.muted = !this.videoElement.muted;
  }

  public setPlaybackRate(rate: PlaybackRate): void {
    this.videoElement.playbackRate = rate;
  }

  public toggleFullscreen(): void {
    if (!this.state.isFullscreen) {
      this.container.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }

  public updatePreviewImages(previewImages: PreviewImage[]): void {
    this.previewImages = previewImages;
  }

  public setPreviewGenerator(generator: (time: number) => string): void {
    this.generatePreview = generator;
  }

  public updateTheme(theme: VideoPlayerTheme): void {
    this.theme = mergeTheme(theme);
    this.applyTheme();
  }

  public setSize(width?: string | number, height?: string | number): void {
    if (width || height) {
      this.container.classList.add("custom-size");

      if (width) {
        const widthValue = typeof width === "number" ? `${width}px` : width;
        this.container.style.setProperty("--player-width", widthValue);
      }

      if (height) {
        const heightValue = typeof height === "number" ? `${height}px` : height;
        this.container.style.setProperty("--player-height", heightValue);
      }
    } else {
      this.container.classList.remove("custom-size");
      this.container.style.removeProperty("--player-width");
      this.container.style.removeProperty("--player-height");
    }
  }

  public setAspectRatio(aspectRatio: string): void {
    this.container.style.aspectRatio = aspectRatio.replace(":", " / ");
  }

  public on<K extends keyof VideoPlayerEvents>(
    event: K,
    callback: VideoPlayerEvents[K]
  ): void {
    this.events[event] = callback;
  }

  public off<K extends keyof VideoPlayerEvents>(event: K): void {
    delete this.events[event];
  }

  public getState(): VideoPlayerState {
    return { ...this.state };
  }

  public destroy(): void {
    this.videoElement.pause();

    // 미리보기 비디오 제거
    if (this.previewVideo && this.previewVideo.parentNode) {
      this.previewVideo.parentNode.removeChild(this.previewVideo);
    }

    this.container.innerHTML = "";
    this.container.className = "";
  }
}
