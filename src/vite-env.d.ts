/// <reference types="vite/client" />

interface UmamiTracker {
  (): void;
  (eventName: string, data?: Record<string, string | number | boolean>): void;
  (data: Record<string, string | number | boolean>): void;
}

interface Umami {
  track: UmamiTracker;
}

interface Window {
  umami?: Umami;
}
