export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: number | null = null;
  let lastExecTime = 0;
  let lastArgs: Parameters<T>;

  const throttledFunction = (...args: Parameters<T>) => {
    lastArgs = args;
    const currentTime = Date.now();

    if (currentTime - lastExecTime > delay) {
      func(...args);
      lastExecTime = currentTime;
    } else if (timeoutId === null) {
      timeoutId = setTimeout(() => {
        func(...lastArgs);
        lastExecTime = Date.now();
        timeoutId = null;
      }, delay - (currentTime - lastExecTime));
    }
  };

  // 정리 함수 추가
  (throttledFunction as any).cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return throttledFunction;
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: number | null = null;

  const debouncedFunction = (...args: Parameters<T>) => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      timeoutId = null;
      func(...args);
    }, delay);
  };

  // 정리 함수 추가
  (debouncedFunction as any).cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return debouncedFunction;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// RAF를 사용한 최적화된 애니메이션 함수
export function rafThrottle<T extends (...args: any[]) => any>(
  func: T
): (...args: Parameters<T>) => void {
  let rafId: number | null = null;
  let lastArgs: Parameters<T>;

  const throttledFunction = (...args: Parameters<T>) => {
    lastArgs = args;

    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        func(...lastArgs);
        rafId = null;
      });
    }
  };

  (throttledFunction as any).cancel = () => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  };

  return throttledFunction;
}

// 메모리 효율적인 이벤트 리스너 관리
export class EventListenerManager {
  private listeners: Array<{
    target: EventTarget;
    type: string;
    listener: EventListener;
    options?: boolean | AddEventListenerOptions;
  }> = [];

  add(
    target: EventTarget,
    type: string,
    listener: EventListener,
    options?: boolean | AddEventListenerOptions
  ): void {
    target.addEventListener(type, listener, options);
    this.listeners.push({ target, type, listener, options });
  }

  removeAll(): void {
    this.listeners.forEach(({ target, type, listener, options }) => {
      target.removeEventListener(type, listener, options);
    });
    this.listeners = [];
  }

  remove(target: EventTarget, type: string, listener: EventListener): void {
    target.removeEventListener(type, listener);
    this.listeners = this.listeners.filter(
      (item) =>
        !(
          item.target === target &&
          item.type === type &&
          item.listener === listener
        )
    );
  }
}

// 안전한 DOM 조작 헬퍼
export function safeQuerySelector<T extends Element>(
  container: Element | Document,
  selector: string
): T | null {
  try {
    return container.querySelector<T>(selector);
  } catch (error) {
    console.warn(`Invalid selector: ${selector}`, error);
    return null;
  }
}

// 접근성을 위한 포커스 관리
export function manageFocus(element: HTMLElement): {
  focus: () => void;
  blur: () => void;
  trap: () => void;
  release: () => void;
} {
  let previousActiveElement: Element | null = null;

  return {
    focus: () => {
      previousActiveElement = document.activeElement;
      element.focus();
    },
    blur: () => {
      element.blur();
    },
    trap: () => {
      // 포커스 트랩 구현 (모달 등에서 사용)
      const focusableElements = element.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[
        focusableElements.length - 1
      ] as HTMLElement;

      const trapFocus = (e: KeyboardEvent) => {
        if (e.key === "Tab") {
          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              lastElement.focus();
              e.preventDefault();
            }
          } else {
            if (document.activeElement === lastElement) {
              firstElement.focus();
              e.preventDefault();
            }
          }
        }
      };

      document.addEventListener("keydown", trapFocus);
      firstElement.focus();

      (element as any)._releaseFocusTrap = () => {
        document.removeEventListener("keydown", trapFocus);
      };
    },
    release: () => {
      if ((element as any)._releaseFocusTrap) {
        (element as any)._releaseFocusTrap();
        delete (element as any)._releaseFocusTrap;
      }

      if (previousActiveElement && "focus" in previousActiveElement) {
        (previousActiveElement as HTMLElement).focus();
      }
    },
  };
}

// 성능 모니터링 유틸리티
export function createPerformanceMonitor(name: string) {
  let startTime: number;

  return {
    start: () => {
      startTime = performance.now();
    },
    end: () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      console.log(`${name} took ${duration.toFixed(2)}ms`);
      return duration;
    },
    measure: <T>(fn: () => T): T => {
      const start = performance.now();
      const result = fn();
      const duration = performance.now() - start;
      console.log(`${name} took ${duration.toFixed(2)}ms`);
      return result;
    },
  };
}
