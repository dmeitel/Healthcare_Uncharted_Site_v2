/**
 * hu-table.js hangs one object off window. Declared here so checkJs stops shrugging at
 * `window.HUTable` in the kit and in the tooling that drives it.
 */
interface HUTableChannel {
  kind: string;
  send(m: any): void;
  onmsg(fn: (m: any) => void): void;
  close(): void;
}

interface HUTableNet {
  mode: 'host' | 'guest' | null;
  room: string;
  name: string;
  seat: string | null;
  chan: HUTableChannel | null;
  seats: Record<string, string>;
  roster: string[];
  lastUiSeq: number;
  pendingT: any;
  _supa: any;
}

interface HUTableMemo {
  keys: { host: string; guest: string };
  get(k: string): any;
  set(k: string, v: any): void;
  clear(k: string): void;
  fresh(r: any): boolean;
}

interface HUTableOffers {
  host: { room: string; hasSave: boolean } | null;
  guest: { room: string; name: string } | null;
}

interface HUTableOptions {
  channelPrefix: string;
  memoKey: string;
  backend: { url: string; anonKey: string } | null;
  seats: { id: string; label: string; desc?: string }[];
  verbSeat: Record<string, string>;
  wire?: string;
  name?: () => string;
  envelope?: () => { save: any; ui?: any };
  onState?: (env: any) => void;
  onResume?: (env: any) => void;
  onRoster?: () => void;
  lobby?: (note?: string) => void;
  dispatch?: (act: string, data: any) => void;
  hint?: (msg: string) => void;
  afterIntent?: (act: string) => void;
}

interface HUTableInstance {
  NET: HUTableNet;
  memo: HUTableMemo;
  escape(v: any): string;
  seatOf(name: string): string | null;
  roomCode(): string;
  host(code?: string): boolean;
  join(code: string, name?: string): boolean;
  leave(): void;
  claim(seat: string): void;
  act(verb: string, data?: any): void;
  broadcast(): void;
  onMessage(m: any): void;
  envelope(): any;
  offers(): HUTableOffers;
  resume(): boolean;
  rejoin(): boolean;
  setChannelFactory(fn: ((room: string) => HUTableChannel | null) | null): void;
}

interface HUTableKit {
  create(opts: HUTableOptions): HUTableInstance;
  escape(v: any): string;
}

interface Window {
  HUTable: HUTableKit;
  /** the vendored supabase-js client factory, loaded by the game page before the kit is used */
  supabase: any;
}

declare var HUTable: HUTableKit;
