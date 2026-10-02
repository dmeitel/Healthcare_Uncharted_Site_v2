/**
 * hu-qr.js hangs one object off window. Declared here so checkJs knows `window.HUQR`.
 */
interface HUQRCode {
  size: number;
  version: number;
  mask: number;
  dark(x: number, y: number): boolean;
}

interface HUQRKit {
  make(text: string): HUQRCode | null;
  svg(text: string, opts?: { label?: string; dark?: string; light?: string }): string;
  MAX_VERSION: number;
}

interface Window {
  HUQR: HUQRKit;
}

declare var HUQR: HUQRKit;
