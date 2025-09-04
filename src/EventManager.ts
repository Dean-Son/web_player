import { VideoPlayerEvents } from "./types";

export class EventManager {
  private events: Map<keyof VideoPlayerEvents, Array<any>> = new Map();

  public on<K extends keyof VideoPlayerEvents>(
    event: K,
    callback: VideoPlayerEvents[K]
  ): void {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(callback);
  }

  public off<K extends keyof VideoPlayerEvents>(event: K, callback?: VideoPlayerEvents[K]): void {
    if (!this.events.has(event)) return;
    
    if (callback) {
      // 특정 콜백 제거
      const callbacks = this.events.get(event)!;
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    } else {
      // 모든 콜백 제거
      this.events.delete(event);
    }
  }

  public emit<K extends keyof VideoPlayerEvents>(
    event: K,
    ...args: Parameters<VideoPlayerEvents[K]>
  ): void {
    const callbacks = this.events.get(event);
    if (callbacks && callbacks.length > 0) {
      callbacks.forEach(callback => {
        try {
          (callback as any)(...args);
        } catch (error) {
          console.error(`Error in event callback for '${String(event)}':`, error);
        }
      });
    }
  }

  public removeAllListeners(): void {
    this.events.clear();
  }

  // 디버깅용 메서드
  public getListenerCount(event: keyof VideoPlayerEvents): number {
    return this.events.get(event)?.length || 0;
  }

  public getAllEvents(): string[] {
    return Array.from(this.events.keys()).map(String);
  }
}
