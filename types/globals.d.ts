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

/** HUKit.dialog: the modal card the game menus sit on (X, Esc and phone back close it) */
interface HUKitDialog {
  el: HTMLDialogElement;
  body: HTMLElement;
  /** the h2; focusable by script (tabindex -1) for a card that is all reading */
  heading: HTMLHeadingElement;
  /** the X, for a card that wants focus to start there */
  x: HTMLButtonElement;
  open(): void;
  /** why reaches onClose; the kit itself passes 'x', 'esc', 'back' or 'backdrop' */
  close(why?: string): void;
  isOpen(): boolean;
}

interface HUKitDialogOpts {
  title?: string;
  body?: Node | string | ((body: HTMLElement, api: HUKitDialog) => Node | string | void);
  className?: string;
  role?: 'dialog' | 'alertdialog';
  /** opt-in: a tap outside the card closes it */
  backdropClose?: boolean;
  /** where focus starts; default the first control in the body, else the X */
  focus?: HTMLElement | (() => HTMLElement | null | undefined);
  onOpen?: () => void;
  onClose?: (why: string) => void;
}

/** anything a menu row can open: a kit card, or a function */
type HUKitOpener = { open(): void } | (() => void);

/** one toggle row: the label, one line of help, and the default */
interface HUKitSettingRow {
  key: string;
  label: string;
  help?: string;
  value?: boolean;
}

interface HUKitSettings {
  el: HTMLDialogElement;
  dialog: HUKitDialog;
  list: HTMLUListElement;
  open(): void;
  close(why?: string): void;
  isOpen(): boolean;
  get(key: string): boolean | undefined;
  values(): Record<string, boolean>;
  /** from code; does not call onChange back */
  set(key: string, value: boolean): void;
}

interface HUKitHowTo {
  el: HTMLDialogElement;
  dialog: HUKitDialog;
  open(): void;
  close(why?: string): void;
  isOpen(): boolean;
  /** this browser has closed the card before */
  seen(): boolean;
  /** open it if this is the first visit; true when it opened */
  firstVisit(): boolean;
  /** the "?" button, 44px, named "How to play" */
  button(): HTMLButtonElement;
}

interface HUKitGameMenu {
  el: HTMLDialogElement;
  dialog: HUKitDialog;
  open(): void;
  close(why?: string): void;
  isOpen(): boolean;
  /** the one toolbar button: the icon and the word Menu, 44px */
  button(): HTMLButtonElement;
}

interface HUKitApi {
  /** true at or under the 699px phone line */
  phone(): boolean;
  /** duration capped to 250ms on phones, 0 under prefers-reduced-motion */
  dcap(ms: number): number;
  /** explain-on-demand: anything with data-def answers a hover, a tap and a keyboard */
  peek(opts?: {
    root?: HTMLElement | string;
    sel?: string;
  }): { close(): void; destroy(): void };
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
  /** Home camera for a U.S. map, fitted to the container. Desktop returns the
   *  shipped frame (zoom 3.6 / minZoom 2.8); narrower viewports get a zoom that
   *  actually holds the lower 48, with the floor always below the home view. */
  conusView(el: HTMLElement | null): {
    center: [number, number];
    zoom: number;
    minZoom: number;
  };
  readonly CONUS: { w: number; s: number; e: number; n: number };
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
  /** the modal card every game menu sits on */
  dialog: {
    (opts?: HUKitDialogOpts): HUKitDialog;
    /** a kit card is up; a game's own key handlers should stand down */
    anyOpen(): boolean;
    /** the last popstate was the card stack's back guard, not a real navigation */
    consumed(): boolean;
  };
  /** Resume, Help, Settings, Restart, Leave, Site menu, in that order */
  gameMenu(opts?: {
    title?: string;
    onResume?: () => void;
    help?: HUKitOpener;
    settings?: HUKitOpener;
    restart?: { verb?: string; title?: string; body?: string | Node; run?: () => void };
    leave?: string | { href: string; label?: string };
    siteMenu?: boolean;
    escOpens?: boolean | ((e: KeyboardEvent) => boolean);
    onOpen?: () => void;
    onClose?: (why: string) => void;
  }): HUKitGameMenu;
  /** toggle rows that apply at once and persist per game */
  settings: {
    (opts?: {
      id?: string;
      title?: string;
      rows?: HUKitSettingRow[];
      onChange?: (key: string, value: boolean, values: Record<string, boolean>) => void;
      onClose?: (why: string) => void;
    }): HUKitSettings;
    /** ready rows a game can opt into; no motion or theme row, those follow the device and the site */
    readonly assist: {
      readonly moreTime: HUKitSettingRow;
      readonly soundsAsText: HUKitSettingRow;
      readonly hints: HUKitSettingRow;
    };
  };
  /** the how-to-play card: by itself on the first visit only */
  howTo(opts?: {
    id?: string;
    title?: string;
    rules?: string[];
    example?: Node | ((el: HTMLElement) => Node | void);
    action?: { label: string; run?: () => void };
    auto?: boolean;
    onClose?: (why: string) => void;
  }): HUKitHowTo;
  /** true only from the named verb; Cancel, X, Esc and back resolve false */
  confirm(opts: {
    title?: string;
    body?: string | Node;
    verb: string;
    danger?: boolean;
  }): Promise<boolean>;
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

  /* Atlas publishes these so its two halves can reach each other without a module
     graph: the routes layer drives the map, and the lazily-fetched search graph
     re-enters the HUD after it lands. Named with underscores because they were
     never meant to be a public API, only a seam inside one page. */
  __atlasBind?: (...args: any[]) => any;
  __atlasSelect?: (...args: any[]) => any;
  __atlasEnsureGraph?: (...args: any[]) => any;
  __lastHudNode?: any;
  updateRoutes?: (...args: any[]) => any;
  _hlRoutes?: (...args: any[]) => any;
  _clrRoutes?: (...args: any[]) => any;
  _focusZoneRoutes?: (...args: any[]) => any;
  _selectRoute?: (...args: any[]) => any;
  _deselectRoute?: (...args: any[]) => any;
  _toggleRouteType?: (...args: any[]) => any;
  _syncConnPanel?: (...args: any[]) => any;

  /* Career Tree loads these two on demand, so they are absent until the user asks
     for a share card or imports a build code from a PDF. */
  html2canvas?: any;
  pdfjsLib?: any;
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

/** D3 v7, loaded from the CDN as a classic script by the atlas and the career tree.
    Untyped on purpose: @types/d3 is a 30-package dependency tree for a build that
    takes pride in having none, and the atlas uses maybe a dozen of its calls. */
declare const d3: any;

/** html2canvas and pdf.js, both injected on demand by the Career Tree: html2canvas
    for the 1080 square share card, pdf.js to read a build code back out of a PDF.
    Neither is on the page until the user asks for that feature. */
declare const html2canvas: any;
declare const pdfjsLib: any;
