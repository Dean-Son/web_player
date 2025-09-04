import { EventManager } from "./EventManager";
import { PreviewImage } from "./types";
import { formatTime } from "./utils";
import { UIElements } from "./VideoPlayerUI";

export class PreviewSystem {
  private elements: UIElements;
  private eventManager: EventManager;
  private previewImages: PreviewImage[];
  private generatePreview: ((time: number) => string) | undefined;
  // previewVideo 제거 - 메인 비디오에서 직접 캡처
  private isGeneratingPreview: boolean = false;
  private cleanupTasks: (() => void)[] = [];

  constructor(
    elements: UIElements,
    eventManager: EventManager,
    previewImages: PreviewImage[] = [],
    generatePreview?: (time: number) => string
  ) {
    this.elements = elements;
    this.eventManager = eventManager;
    this.previewImages = previewImages;
    this.generatePreview = generatePreview;
  }

  public setupPreviewEvents(): void {
    // progress-container에서 이벤트를 처리하여 더 넓은 영역에서 호버 감지
    const progressContainer = this.elements.progressBar.parentElement;
    if (!progressContainer) {
      console.warn("Progress container not found");
      return;
    }

    const handleProgressHover = (e: MouseEvent) => {
      const rect = this.elements.progressBar.getBoundingClientRect();
      const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const time = percent * this.getDuration();

      // 유효한 시간인지 확인
      if (isNaN(time) || time < 0) {
        return;
      }

      this.showPreview(e.clientX - rect.left, time);
      this.eventManager.emit("previewhover", time);
    };

    const mouseEnterHandler = () => {
      this.elements.previewTooltip.classList.add("visible");
    };

    const mouseLeaveHandler = () => {
      this.elements.previewTooltip.classList.remove("visible");
    };

    // progress-container와 progress-bar 모두에 이벤트 등록
    progressContainer.addEventListener("mousemove", handleProgressHover);
    progressContainer.addEventListener("mouseenter", mouseEnterHandler);
    progressContainer.addEventListener("mouseleave", mouseLeaveHandler);
    
    this.elements.progressBar.addEventListener("mousemove", handleProgressHover);
    this.elements.progressBar.addEventListener("mouseenter", mouseEnterHandler);
    this.elements.progressBar.addEventListener("mouseleave", mouseLeaveHandler);

    this.addCleanupTask(() => {
      progressContainer.removeEventListener("mousemove", handleProgressHover);
      progressContainer.removeEventListener("mouseenter", mouseEnterHandler);
      progressContainer.removeEventListener("mouseleave", mouseLeaveHandler);
      
      this.elements.progressBar.removeEventListener("mousemove", handleProgressHover);
      this.elements.progressBar.removeEventListener("mouseenter", mouseEnterHandler);
      this.elements.progressBar.removeEventListener("mouseleave", mouseLeaveHandler);
    });
  }

  public createPreviewVideo(videoSrc: string): void {
    try {
      if (!videoSrc) {
        console.log("미리보기 시스템: 메인 비디오에서 직접 캡처 모드로 동작");
        return;
      }

      // 새로운 방식: 메인 비디오에서 직접 캡처
      // 별도의 previewVideo 생성하지 않음
      console.log("미리보기 시스템 초기화 완료 - 메인 비디오 직접 캡처 방식");
      
    } catch (error) {
      console.error("미리보기 시스템 초기화 실패:", error);
      this.eventManager.emit(
        "error",
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  // 더 이상 사용하지 않는 메서드 (메인 비디오에서 직접 캡처하므로)

  private showPreview(position: number, time: number): void {
    try {
      if (!this.elements.previewTooltip) {
        console.warn("Preview tooltip element not found");
        return;
      }

      if (isNaN(time) || time < 0) {
        console.warn("Invalid preview time:", time);
        return;
      }

      console.log("showPreview 호출:", { position, time });

      // 미리보기 툴팁 위치 설정
      const clampedPosition = Math.max(0, position);
      this.elements.previewTooltip.style.left = `${clampedPosition}px`;

      // 시간 표시 업데이트
      const timeElement =
        this.elements.previewTooltip.querySelector(".preview-time");
      if (timeElement) {
        timeElement.textContent = formatTime(time);
      }

      // 실시간 프레임 캡처 시도
      this.generateFramePreview(time);
    } catch (error) {
      console.error("미리보기 표시 에러:", error);
      this.eventManager.emit(
        "error",
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  private async generateFramePreview(time: number): Promise<void> {
    if (this.isGeneratingPreview || time < 0 || time > this.getDuration()) {
      return;
    }

    this.isGeneratingPreview = true;

    try {
      // 미리 준비된 이미지가 있는지 확인
      const staticPreview = this.findPreviewImage(time);
      const imageElement = this.elements.previewTooltip.querySelector(
        ".preview-image"
      ) as HTMLImageElement;

      if (staticPreview) {
        // 정적 이미지 사용
        imageElement.src = staticPreview;
        imageElement.style.display = "block";
        this.elements.previewCanvas.style.display = "none";
      } else {
        // 메인 비디오에서 실시간 프레임 캡처
        await this.captureVideoFrame(time);
        imageElement.style.display = "none";
        this.elements.previewCanvas.style.display = "block";
      }
    } catch (error) {
      console.warn("프레임 캡처 실패:", error);
      // 기본 이미지 또는 빈 상태로 표시
      const imageElement = this.elements.previewTooltip.querySelector(
        ".preview-image"
      ) as HTMLImageElement;
      imageElement.style.display = "none";
      this.elements.previewCanvas.style.display = "none";
    } finally {
      this.isGeneratingPreview = false;
    }
  }

  private async captureVideoFrame(time: number): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // 메인 비디오에서 직접 캡처하는 새로운 방식
        const mainVideo = this.elements.videoElement;
        
        if (!mainVideo || !this.elements.previewCanvas) {
          reject(new Error("Video or canvas not available"));
          return;
        }

        // 메인 비디오가 로드되지 않았으면 대기
        if (mainVideo.readyState < 2) {
          const timeoutId = setTimeout(() => {
            reject(new Error("Main video loading timeout"));
          }, 2000);

          const onCanPlay = () => {
            clearTimeout(timeoutId);
            mainVideo.removeEventListener("canplay", onCanPlay);
            this.captureVideoFrame(time).then(resolve).catch(reject);
          };

          mainVideo.addEventListener("canplay", onCanPlay);
          return;
        }

        // 현재 재생 상태 저장
        const originalTime = mainVideo.currentTime;
        const wasPlaying = !mainVideo.paused;
        
        // 즉시 프레임 캡처 시도 (seek 없이)
        if (Math.abs(originalTime - time) < 0.5) {
          // 현재 시간과 요청 시간이 0.5초 이내면 즉시 캡처
          this.drawCurrentFrame(mainVideo);
          resolve();
          return;
        }

        // seek이 필요한 경우
        const onTimeUpdate = () => {
          try {
            if (Math.abs(mainVideo.currentTime - time) < 0.1) {
              // 목표 시간에 도달
              this.drawCurrentFrame(mainVideo);
              
              // 원래 상태로 복원
              mainVideo.currentTime = originalTime;
              if (wasPlaying) {
                mainVideo.play().catch(() => {});
              }
              
              mainVideo.removeEventListener("timeupdate", onTimeUpdate);
              resolve();
            }
          } catch (error) {
            mainVideo.removeEventListener("timeupdate", onTimeUpdate);
            reject(error);
          }
        };

        // 타임아웃 설정 (1초)
        const timeout = setTimeout(() => {
          mainVideo.removeEventListener("timeupdate", onTimeUpdate);
          // 타임아웃 시에도 현재 프레임 캡처 시도
          try {
            this.drawCurrentFrame(mainVideo);
            resolve();
          } catch (error) {
            reject(new Error("Frame capture timeout"));
          }
        }, 1000);

        mainVideo.addEventListener("timeupdate", () => {
          clearTimeout(timeout);
          onTimeUpdate();
        });

        // 일시정지 후 시간 이동
        mainVideo.pause();
        mainVideo.currentTime = time;
        
      } catch (error) {
        reject(error);
      }
    });
  }

  private drawCurrentFrame(video: HTMLVideoElement): void {
    try {
      const ctx = this.elements.previewCanvas.getContext("2d");
      if (ctx && video.videoWidth > 0 && video.videoHeight > 0) {
        // Canvas 크기 설정
        const canvas = this.elements.previewCanvas;
        canvas.width = 160;
        canvas.height = 90;
        
        // 비디오 프레임을 캔버스에 그리기
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // 이미지 품질 향상
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
      }
    } catch (error) {
      console.warn("Frame drawing failed:", error);
    }
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
          return image.url;
        }
      }
    }

    return null;
  }

  private getDuration(): number {
    return this.elements.videoElement.duration || 0;
  }

  public updatePreviewImages(previewImages: PreviewImage[]): void {
    this.previewImages = previewImages;
  }

  public setPreviewGenerator(generator: (time: number) => string): void {
    this.generatePreview = generator;
  }

  private addCleanupTask(cleanup: () => void): void {
    this.cleanupTasks.push(cleanup);
  }

  public destroy(): void {
    this.cleanupTasks.forEach((cleanup) => cleanup());
    this.cleanupTasks = [];
  }
}
