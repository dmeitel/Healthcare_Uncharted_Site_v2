/**
 * hu-rng.js hangs one object off window. Declared here so checkJs stops shrugging at
 * `window.HURng` in the kit and in the tooling that calls it.
 */
interface HURngState { seed: number; n: number; }

interface HURngGenerator {
  (): number;
  int(lo: number, hi: number): number;
  pick<T>(list: T[]): T;
  chance(p: number): boolean;
  state(): HURngState;
  restore(state: HURngState): HURngGenerator;
  seed: number;
}

interface HURngKit {
  make(seed: number | string): HURngGenerator;
  seedFrom(str: string): number;
  freshSeed(): number;
}

interface Window {
  HURng: HURngKit;
}

declare var HURng: HURngKit;
