/**
 * Ambient declarations for the globals this site hangs off `window`.
 *
 * The tools are plain scripts, not modules, so they publish their APIs on window.
 * Declaring them here means the type checker can verify every call site instead of
 * shrugging at `window.HUKit`, which is the whole point of turning checkJs on.
 */

interface HUKitSheet {
  el: HTMLElement;
  open(detent?: 'dt-peek' | 'dt-half' | 'dt-full'): void;
  close(): void;
  setDetent(detent: 'dt-peek' | 'dt-half' | 'dt-full'): void;
  isOpen(): boolean;
}

interface HUKitPop {
  open(trigger: HTMLElement, pop: HTMLElement, build?: () => void): void;
  close(refocus?: boolean): void;
  isOpen(): boolean;
  current(): { pop: HTMLElement; btn: HTMLElement } | null;
  /** the popover rung of the one-step-back walk. true = this press was consumed */
  escape(): boolean;
}

interface HUKitUrlState {
  sync(): void;
  queue(): void;
  suspend(fn: () => void): void;
  begin(): void;
  end(): void;
  isApplying(): boolean;
  mark(scope: string): void;
}

interface HUKitBackGuard {
  consumed(): boolean;
  arm(): void;
}

interface HUKitApi {
  /** true at or under the 699px phone line */
  phone(): boolean;
  /** duration capped to 250ms on phones, 0 under prefers-reduced-motion */
  dcap(ms: number): number;
  sheet(el: HTMLElement, opts?: {
    onDismiss?: () => void;
    onDetent?: (detent: string) => void;
    startDetent?: 'dt-peek' | 'dt-half' | 'dt-full';
    escape?: boolean;
  }): HUKitSheet;
  locate(btn: HTMLElement, opts?: {
    onFix?: (fix: { lat: number; lon: number; accuracy: number }) => void;
    onError?: (err: unknown) => void;
  }): void;
  backGuard(opts: {
    watch: HTMLElement;
    active: () => boolean;
    step: () => void;
  }): HUKitBackGuard;
  innerPoint(geom: unknown): [number, number] | null;
  pop(opts?: {
    anchorEl?: HTMLElement;
    triggerSel?: string;
    focusSelected?: boolean;
    onOpen?: () => void;
  }): HUKitPop;
  urlState(opts: {
    url: () => string;
    scope?: () => string;
    seeded?: boolean;
    debounce?: number;
  }): HUKitUrlState;
  PHONE_MQ: MediaQueryList;
}

/**
 * Assignment Compass's pure calculation layer (assignment-compass-engine.js).
 * A UMD factory, published on window for the tool module to read.
 */
interface CompassEngineApi {
  marginal(...args: any[]): any;
  stateIncomeTax(...args: any[]): any;
  payrollTax(...args: any[]): any;
  federalTax(...args: any[]): any;
  ficaTax(...args: any[]): any;
  netPay(...args: any[]): any;
  colRatio(...args: any[]): any;
  rentSignal(...args: any[]): any;
  housingRatio(...args: any[]): any;
  projectCosts(...args: any[]): any;
  monthlyPosition(...args: any[]): any;
  breakeven(...args: any[]): any;
  hourlyToAnnual(...args: any[]): any;
  COL_IDX: Record<string, number>;
}

interface Window {
  HUKit?: HUKitApi;
  HUSearch?: unknown;
  CompassEngine?: CompassEngineApi;
  /** icon renderer, loaded site-wide from the CDN by base.njk */
  lucide?: LucideApi;
  /** analytics beacon, absent on localhost */
  goatcounter?: { count?: (opts: Record<string, unknown>) => void; no_onload?: boolean };

  /* Build-time datasets. Nunjucks writes them into the page as application/json and
     the tool module republishes them here, under the names its logic already uses. */
  LENS_CONFIG?: any;
  STATE_DATA?: any;
  DATA_YEARS?: any;
}

/** The tools reference HUKit bare, not window.HUKit; hu-kit.js is a classic script
    loaded before every module that uses it. */
declare const HUKit: HUKitApi;

/** Lucide swaps every <i data-lucide> for its <svg>. Loaded site-wide by base.njk
    as a classic script, so it is there before any tool module runs; the tools still
    guard on window.lucide because a CDN can fail. */
interface LucideApi { createIcons(opts?: Record<string, unknown>): void; }
declare const lucide: LucideApi;

/** MapLibre GL, loaded from the CDN as a classic script by both map tools. */
declare const maplibregl: any;
