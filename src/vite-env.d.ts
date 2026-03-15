/// <reference types="vite/client" />

interface PlausibleEventOptions {
  callback?: () => void;
  props?: Record<string, string | number | boolean>;
}

interface PlausibleFn {
  (eventName: string, options?: PlausibleEventOptions): void;
  init?: (options?: Record<string, unknown>) => void;
  o?: Record<string, unknown>;
  q?: IArguments[];
}

interface Window {
  plausible?: PlausibleFn;
}
