export interface UIElements {
  videoElement: HTMLVideoElement;
  controlsElement: HTMLElement;
  progressBar: HTMLElement;
  progressFill: HTMLElement;
  progressHandle: HTMLElement;
  playButton: HTMLElement;
  playButtonOverlay: HTMLElement;
  timeDisplay: HTMLElement;
  volumeSlider: HTMLElement;
  volumeFill: HTMLElement;
  volumeButton: HTMLElement;
  speedButton: HTMLElement;
  speedMenu: HTMLElement;
  fullscreenButton: HTMLElement;
  loadingOverlay: HTMLElement;
  previewTooltip: HTMLElement;
  previewCanvas: HTMLCanvasElement;
}

export class VideoPlayerUI {
  private container: HTMLElement;
  private elements: UIElements | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  public createElements(): UIElements {
    this.container.className = "dean-video-player";

    this.container.innerHTML = `
      <video 
        role="application" 
        aria-label="비디오 플레이어"
        tabindex="0">
      </video>
      
      <div 
        class="loading-overlay" 
        role="status" 
        aria-live="polite" 
        aria-label="로딩 중">
        <div class="loading-spinner" aria-hidden="true"></div>
      </div>
      
      <div class="controls-overlay" role="button" tabindex="0" aria-label="재생/일시정지">
        <div class="play-button-overlay" aria-hidden="true">
          <span>▶</span>
        </div>
      </div>
      
      <div class="controls" role="toolbar" aria-label="비디오 컨트롤">
        <div class="progress-container" role="group" aria-label="진행률 컨트롤">
          <div 
            class="progress-bar"
            role="slider"
            aria-label="재생 진행률"
            aria-valuemin="0"
            aria-valuemax="100"
            aria-valuenow="0"
            aria-valuetext="0% 완료"
            tabindex="0">
            <div class="progress-fill" aria-hidden="true"></div>
            <div class="progress-handle" aria-hidden="true"></div>
            <div 
              class="preview-tooltip"
              role="tooltip" 
              aria-hidden="true">
              <canvas 
                class="preview-canvas" 
                width="160" 
                height="90"
                aria-label="비디오 미리보기">
              </canvas>
              <img 
                class="preview-image" 
                src="" 
                alt="비디오 미리보기"
                style="
                  display: none;
                  width: 160px;
                  height: 90px;
                  border-radius: 4px;
                  margin-bottom: 4px;
                ">
              <div class="preview-time" aria-live="polite">0:00</div>
            </div>
          </div>
        </div>
        
        <div class="controls-row" role="group" aria-label="재생 컨트롤">
          <button 
            class="control-button play-button" 
            aria-label="재생/일시정지" 
            aria-pressed="false"
            type="button">▶</button>
          <button 
            class="control-button backward-button" 
            aria-label="10초 뒤로 이동"
            type="button">⏪</button>
          <button 
            class="control-button forward-button" 
            aria-label="10초 앞으로 이동"
            type="button">⏩</button>
          
          <div 
            class="time-display" 
            role="timer" 
            aria-live="off"
            aria-label="재생 시간">
            <span class="current-time">0:00</span> / <span class="total-time">0:00</span>
          </div>
          
          <div style="flex: 1;" aria-hidden="true"></div>
          
          <div class="volume-container" role="group" aria-label="볼륨 컨트롤">
            <button 
              class="control-button volume-button" 
              aria-label="음소거/해제"
              aria-pressed="false"
              type="button">🔊</button>
            <div 
              class="volume-slider"
              role="slider"
              aria-label="볼륨"
              aria-valuemin="0"
              aria-valuemax="100"
              aria-valuenow="100"
              aria-valuetext="볼륨 100%"
              tabindex="0">
              <div class="volume-fill" aria-hidden="true"></div>
            </div>
          </div>
          
          <div class="speed-selector" role="group" aria-label="재생 속도">
            <button 
              class="control-button speed-button" 
              aria-label="재생 속도 선택"
              aria-expanded="false"
              aria-haspopup="true"
              type="button">1x</button>
            <div 
              class="speed-menu"
              role="menu"
              aria-label="재생 속도 옵션">
              <button 
                class="speed-option" 
                data-speed="0.5"
                role="menuitem"
                type="button">0.5x</button>
              <button 
                class="speed-option active" 
                data-speed="1"
                role="menuitem"
                aria-current="true"
                type="button">1x</button>
              <button 
                class="speed-option" 
                data-speed="1.5"
                role="menuitem"
                type="button">1.5x</button>
              <button 
                class="speed-option" 
                data-speed="2"
                role="menuitem"
                type="button">2x</button>
            </div>
          </div>
          
          <button 
            class="control-button fullscreen-button" 
            aria-label="전체화면/해제"
            aria-pressed="false"
            type="button">⛶</button>
        </div>
      </div>
    `;

    // Get element references
    this.elements = {
      videoElement: this.container.querySelector("video")!,
      controlsElement: this.container.querySelector(".controls")!,
      progressBar: this.container.querySelector(".progress-bar")!,
      progressFill: this.container.querySelector(".progress-fill")!,
      progressHandle: this.container.querySelector(".progress-handle")!,
      playButton: this.container.querySelector(".play-button")!,
      playButtonOverlay: this.container.querySelector(".play-button-overlay")!,
      timeDisplay: this.container.querySelector(".time-display")!,
      volumeSlider: this.container.querySelector(".volume-slider")!,
      volumeFill: this.container.querySelector(".volume-fill")!,
      volumeButton: this.container.querySelector(".volume-button")!,
      speedButton: this.container.querySelector(".speed-button")!,
      speedMenu: this.container.querySelector(".speed-menu")!,
      fullscreenButton: this.container.querySelector(".fullscreen-button")!,
      previewTooltip: this.container.querySelector(".preview-tooltip")!,
      previewCanvas: this.container.querySelector(".preview-canvas")!,
      loadingOverlay: this.container.querySelector(".loading-overlay")!,
    };

    return this.elements;
  }

  public getElements(): UIElements {
    if (!this.elements) {
      throw new Error("UI elements not created. Call createElements() first.");
    }
    return this.elements;
  }

  public setupSize(
    width?: string | number,
    height?: string | number,
    aspectRatio?: string
  ): void {
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
    }

    if (aspectRatio) {
      this.container.style.aspectRatio = aspectRatio.replace(":", " / ");
    }
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

  public destroy(): void {
    this.container.innerHTML = "";
    this.container.className = "";
    this.elements = null;
  }
}
