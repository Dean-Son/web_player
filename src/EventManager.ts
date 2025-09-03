import { VideoPlayerEvents } from "./types";

export class EventManager {
  private events: Partial<VideoPlayerEvents> = {};

  public on<K extends keyof VideoPlayerEvents>(
    event: K,
    callback: VideoPlayerEvents[K]
  ): void {
    this.events[event] = callback;
  }

  public off<K extends keyof VideoPlayerEvents>(event: K): void {
    delete this.events[event];
  }

  public emit<K extends keyof VideoPlayerEvents>(
    event: K,
    ...args: Parameters<VideoPlayerEvents[K]>
  ): void {
    const callback = this.events[event];
    if (callback) {
      (callback as any)(...args);
    }
  }

  public removeAllListeners(): void {
    this.events = {};
  }
}
