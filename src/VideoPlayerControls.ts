import { EventManager } from "./EventManager";
import { PlaybackRate, VideoPlayerState } from "./types";
import { clamp, throttle } from "./utils";
import { UIElements } from "./VideoPlayerUI";

export class VideoPlayerControls {
  private elements: UIElements;
  private state: VideoPlayerState;
  private eventManager: EventManager;
  private cleanupTasks: (() => void)[] = [];
  private isDragging: boolean = false;

  constructor(
    elements: UIElements,
    state: VideoPlayerState,
    eventManager: EventManager
  ) {
    this.elements = elements;
    this.state = state;
    this.eventManager = eventManager;
  }

  public setupEventListeners(): void {
    this.setupVideoEvents();
    this.setupControlEvents();
    this.setupProgressBarEvents();
    this.setupVolumeSliderEvents();
    this.setupSpeedMenuEvents();
    this.setupKeyboardEvents();
    this.setupFullscreenEvents();
  }

  private setupVideoEvents(): void {
    const video = this.elements.videoElement;

    // Loading state handlers with error handling
    const loadStartHandler = () => {
      try {
        this.setLoading(true);
        this.eventManager.emit("loadstart");
      } catch (error) {
        console.error("loadstart 핸들러 에러:", error);
        this.eventManager.emit(
          "error",
          error instanceof Error ? error : new Error(String(error))
        );
      }
    };

    const canPlayHandler = () => {
      try {
        this.setLoading(false);
        this.eventManager.emit("canplay");
      } catch (error) {
        console.error("canplay 핸들러 에러:", error);
        this.eventManager.emit(
          "error",
          error instanceof Error ? error : new Error(String(error))
        );
      }
    };

    const waitingHandler = () => {
      try {
        this.setLoading(true);
      } catch (error) {
        console.error("waiting 핸들러 에러:", error);
        this.eventManager.emit(
          "error",
          error instanceof Error ? error : new Error(String(error))
        );
      }
    };

    const playingHandler = () => {
      try {
        this.setLoading(false);
      } catch (error) {
        console.error("playing 핸들러 에러:", error);
        this.eventManager.emit(
          "error",
          error instanceof Error ? error : new Error(String(error))
        );
      }
    };

    // Error handler for video element
    const errorHandler = (event: ErrorEvent) => {
      console.error("비디오 에러:", event);
      this.setLoading(false);
      const error = new Error(
        `비디오 로드 실패: ${event.error?.message || "Unknown error"}`
      );
      this.eventManager.emit("error", error);
    };

    const endedHandler = () => {
      try {
        this.state.isPlaying = false;
        this.eventManager.emit("ended");
      } catch (error) {
        console.error("ended 핸들러 에러:", error);
        this.eventManager.emit(
          "error",
          error instanceof Error ? error : new Error(String(error))
        );
      }
    };

    video.addEventListener("loadstart", loadStartHandler);
    video.addEventListener("canplay", canPlayHandler);
    video.addEventListener("waiting", waitingHandler);
    video.addEventListener("playing", playingHandler);
    video.addEventListener("error", errorHandler);
    video.addEventListener("ended", endedHandler);

    this.addCleanupTask(() => {
      video.removeEventListener("loadstart", loadStartHandler);
      video.removeEventListener("canplay", canPlayHandler);
      video.removeEventListener("waiting", waitingHandler);
      video.removeEventListener("playing", playingHandler);
      video.removeEventListener("error", errorHandler);
      video.removeEventListener("ended", endedHandler);
    });

    const playHandler = () => {
      this.state.isPlaying = true;
      this.eventManager.emit("play");
    };

    const pauseHandler = () => {
      this.state.isPlaying = false;
      this.eventManager.emit("pause");
    };

    video.addEventListener("play", playHandler);
    video.addEventListener("pause", pauseHandler);

    this.addCleanupTask(() => {
      video.removeEventListener("play", playHandler);
      video.removeEventListener("pause", pauseHandler);
    });

    const timeUpdateHandler = throttle(() => {
      this.state.currentTime = video.currentTime;
      this.eventManager.emit("timeupdate", this.state.currentTime);
    }, 100);

    video.addEventListener("timeupdate", timeUpdateHandler);
    this.addCleanupTask(() =>
      video.removeEventListener("timeupdate", timeUpdateHandler)
    );

    const durationChangeHandler = () => {
      this.state.duration = video.duration;
      this.eventManager.emit("durationchange", this.state.duration);
    };

    const volumeChangeHandler = () => {
      this.state.volume = video.volume;
      this.state.isMuted = video.muted;
      this.eventManager.emit("volumechange", this.state.volume);
    };

    const rateChangeHandler = () => {
      this.state.playbackRate = video.playbackRate as PlaybackRate;
      this.eventManager.emit(
        "ratechange",
        this.state.playbackRate as PlaybackRate
      );
    };

    video.addEventListener("durationchange", durationChangeHandler);
    video.addEventListener("volumechange", volumeChangeHandler);
    video.addEventListener("ratechange", rateChangeHandler);

    this.addCleanupTask(() => {
      video.removeEventListener("durationchange", durationChangeHandler);
      video.removeEventListener("volumechange", volumeChangeHandler);
      video.removeEventListener("ratechange", rateChangeHandler);
    });
  }

  private setupControlEvents(): void {
    const playHandler = () => this.togglePlay();
    const backwardHandler = () => this.seek(-10);
    const forwardHandler = () => this.seek(10);
    const volumeHandler = () => this.toggleMute();
    const fullscreenHandler = () => this.toggleFullscreen();

    this.elements.playButton.addEventListener("click", playHandler);
    this.elements.playButtonOverlay.addEventListener("click", playHandler);
    this.elements.volumeButton.addEventListener("click", volumeHandler);
    this.elements.fullscreenButton.addEventListener("click", fullscreenHandler);

    const backwardButton =
      this.elements.controlsElement.querySelector(".backward-button")!;
    const forwardButton =
      this.elements.controlsElement.querySelector(".forward-button")!;

    backwardButton.addEventListener("click", backwardHandler);
    forwardButton.addEventListener("click", forwardHandler);

    this.addCleanupTask(() => {
      this.elements.playButton.removeEventListener("click", playHandler);
      this.elements.playButtonOverlay.removeEventListener("click", playHandler);
      this.elements.volumeButton.removeEventListener("click", volumeHandler);
      this.elements.fullscreenButton.removeEventListener(
        "click",
        fullscreenHandler
      );
      backwardButton.removeEventListener("click", backwardHandler);
      forwardButton.removeEventListener("click", forwardHandler);
    });
  }

  private setupProgressBarEvents(): void {
    const handleProgressClick = (e: MouseEvent) => {
      try {
        if (!this.elements.progressBar) {
          console.warn("Progress bar element not found");
          return;
        }

        const rect = this.elements.progressBar.getBoundingClientRect();
        if (rect.width === 0) {
          console.warn("Progress bar width is 0");
          return;
        }

        const percent = Math.max(
          0,
          Math.min(1, (e.clientX - rect.left) / rect.width)
        );
        const time = percent * this.state.duration;

        if (isNaN(time) || time < 0) {
          console.warn("Invalid time calculated:", time);
          return;
        }

        this.setCurrentTime(time);
      } catch (error) {
        console.error("진행 바 클릭 처리 에러:", error);
        this.eventManager.emit(
          "error",
          error instanceof Error ? error : new Error(String(error))
        );
      }
    };

    const clickHandler = (e: MouseEvent) => handleProgressClick(e);
    this.elements.progressBar.addEventListener("click", clickHandler);
    this.addCleanupTask(() =>
      this.elements.progressBar.removeEventListener("click", clickHandler)
    );

    let isDragging = false;

    const mouseDownHandler = (e: MouseEvent) => {
      isDragging = true;
      handleProgressClick(e);
    };

    const mouseMoveHandler = (e: MouseEvent) => {
      if (isDragging) {
        handleProgressClick(e);
      }
    };

    const mouseUpHandler = () => {
      isDragging = false;
    };

    this.elements.progressBar.addEventListener("mousedown", mouseDownHandler);
    document.addEventListener("mousemove", mouseMoveHandler);
    document.addEventListener("mouseup", mouseUpHandler);

    this.addCleanupTask(() => {
      this.elements.progressBar.removeEventListener(
        "mousedown",
        mouseDownHandler
      );
      document.removeEventListener("mousemove", mouseMoveHandler);
      document.removeEventListener("mouseup", mouseUpHandler);
    });
  }

  private setupVolumeSliderEvents(): void {
    const handleVolumeClick = (e: MouseEvent) => {
      const rect = this.elements.volumeSlider.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      this.setVolume(clamp(percent, 0, 1));
    };

    const clickHandler = (e: MouseEvent) => handleVolumeClick(e);
    this.elements.volumeSlider.addEventListener("click", clickHandler);
    this.addCleanupTask(() =>
      this.elements.volumeSlider.removeEventListener("click", clickHandler)
    );

    let isDragging = false;

    const mouseDownHandler = (e: MouseEvent) => {
      isDragging = true;
      handleVolumeClick(e);
    };

    const mouseMoveHandler = (e: MouseEvent) => {
      if (isDragging) {
        handleVolumeClick(e);
      }
    };

    const mouseUpHandler = () => {
      isDragging = false;
    };

    this.elements.volumeSlider.addEventListener("mousedown", mouseDownHandler);
    document.addEventListener("mousemove", mouseMoveHandler);
    document.addEventListener("mouseup", mouseUpHandler);

    this.addCleanupTask(() => {
      this.elements.volumeSlider.removeEventListener(
        "mousedown",
        mouseDownHandler
      );
      document.removeEventListener("mousemove", mouseMoveHandler);
      document.removeEventListener("mouseup", mouseUpHandler);
    });
  }

  private setupSpeedMenuEvents(): void {
    const speedSelector =
      this.elements.controlsElement.querySelector(".speed-selector")!;

    const mouseEnterHandler = () => {
      this.elements.speedMenu.style.opacity = "1";
      this.elements.speedMenu.style.visibility = "visible";
      this.elements.speedMenu.style.transform = "translateY(0)";
    };

    const mouseLeaveHandler = () => {
      this.elements.speedMenu.style.opacity = "0";
      this.elements.speedMenu.style.visibility = "hidden";
      this.elements.speedMenu.style.transform = "translateY(10px)";
    };

    speedSelector.addEventListener("mouseenter", mouseEnterHandler);
    speedSelector.addEventListener("mouseleave", mouseLeaveHandler);

    const menuClickHandler = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains("speed-option")) {
        const speed = parseFloat(target.dataset.speed!) as PlaybackRate;
        this.setPlaybackRate(speed);

        // Update active state
        this.elements.speedMenu
          .querySelectorAll(".speed-option")
          .forEach((option) => {
            (option as HTMLElement).style.background = "none";
            (option as HTMLElement).classList.remove("active");
          });
        target.style.background = "var(--player-primary-color, #007bff)";
        target.classList.add("active");
      }
    };

    this.elements.speedMenu.addEventListener("click", menuClickHandler);

    this.addCleanupTask(() => {
      speedSelector.removeEventListener("mouseenter", mouseEnterHandler);
      speedSelector.removeEventListener("mouseleave", mouseLeaveHandler);
      this.elements.speedMenu.removeEventListener("click", menuClickHandler);
    });
  }

  private setupKeyboardEvents(): void {
    const keydownHandler = (e: KeyboardEvent) => {
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
    };

    // Make container focusable
    const container = this.elements.videoElement.parentElement!;
    container.tabIndex = 0;
    container.addEventListener("keydown", keydownHandler);

    this.addCleanupTask(() => {
      container.removeEventListener("keydown", keydownHandler);
    });
  }

  private setupFullscreenEvents(): void {
    const fullscreenChangeHandler = () => {
      this.state.isFullscreen = !!document.fullscreenElement;
      this.eventManager.emit("fullscreenchange", this.state.isFullscreen);
    };

    document.addEventListener("fullscreenchange", fullscreenChangeHandler);
    this.addCleanupTask(() =>
      document.removeEventListener("fullscreenchange", fullscreenChangeHandler)
    );
  }

  private setLoading(loading: boolean): void {
    this.state.isLoading = loading;
    this.elements.loadingOverlay.classList.toggle("visible", loading);
  }

  // Public control methods
  public async play(): Promise<void> {
    try {
      if (!this.elements.videoElement) {
        throw new Error("Video element not found");
      }

      if (this.elements.videoElement.readyState < 2) {
        console.warn("Video not ready, attempting to play anyway");
      }

      await this.elements.videoElement.play();
      console.log("재생 성공");
    } catch (error) {
      console.error("재생 실패:", error);

      // 브라우저별 에러 메시지 처리
      let errorMessage = "재생 실패";
      if (error instanceof Error) {
        if (error.name === "NotAllowedError") {
          errorMessage =
            "자동 재생이 차단되었습니다. 사용자 상호작용이 필요합니다.";
        } else if (error.name === "NotSupportedError") {
          errorMessage = "지원되지 않는 비디오 형식입니다.";
        } else if (error.name === "AbortError") {
          errorMessage = "비디오 로드가 중단되었습니다.";
        } else {
          errorMessage = error.message || "알 수 없는 재생 오류";
        }
      }

      const playError = new Error(errorMessage);
      this.eventManager.emit("error", playError);
      throw playError;
    }
  }

  public pause(): void {
    this.elements.videoElement.pause();
  }

  public togglePlay(): void {
    if (this.state.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  public setCurrentTime(time: number): void {
    try {
      if (!this.elements.videoElement) {
        throw new Error("Video element not found");
      }

      if (isNaN(time) || !isFinite(time)) {
        console.warn("Invalid time value:", time);
        return;
      }

      const duration =
        this.state.duration || this.elements.videoElement.duration || 0;
      const clampedTime = clamp(time, 0, duration);

      this.elements.videoElement.currentTime = clampedTime;
    } catch (error) {
      console.error("시간 설정 실패:", error);
      this.eventManager.emit(
        "error",
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  public seek(seconds: number): void {
    this.setCurrentTime(this.state.currentTime + seconds);
  }

  public setVolume(volume: number): void {
    this.elements.videoElement.volume = clamp(volume, 0, 1);
    if (volume > 0) {
      this.elements.videoElement.muted = false;
    }
  }

  public toggleMute(): void {
    this.elements.videoElement.muted = !this.elements.videoElement.muted;
  }

  public setPlaybackRate(rate: PlaybackRate): void {
    this.elements.videoElement.playbackRate = rate;
  }

  public toggleFullscreen(): void {
    try {
      const container = this.elements.videoElement?.parentElement;
      if (!container) {
        throw new Error("Container element not found");
      }

      if (!document.fullscreenEnabled) {
        throw new Error("Fullscreen not supported");
      }

      if (!this.state.isFullscreen) {
        container.requestFullscreen().catch((error) => {
          console.error("전체화면 요청 실패:", error);
          this.eventManager.emit(
            "error",
            new Error(`전체화면 진입 실패: ${error.message}`)
          );
        });
      } else {
        document.exitFullscreen().catch((error) => {
          console.error("전체화면 종료 실패:", error);
          this.eventManager.emit(
            "error",
            new Error(`전체화면 종료 실패: ${error.message}`)
          );
        });
      }
    } catch (error) {
      console.error("전체화면 토글 실패:", error);
      this.eventManager.emit(
        "error",
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  private addCleanupTask(cleanup: () => void): void {
    this.cleanupTasks.push(cleanup);
  }

  public destroy(): void {
    this.cleanupTasks.forEach((cleanup) => cleanup());
    this.cleanupTasks = [];
  }
}
