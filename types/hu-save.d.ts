/**
 * hu-save.js hangs one object off window. Declared here so checkJs stops shrugging at
 * `window.HUSave` in the kit and in any tooling that calls it.
 */
interface HUSaveCodec {
  prefix: string;
  rawPrefix: string;
  encode(obj: any): Promise<string>;
  decode(str: string): Promise<any>;
}

interface HUSaveKit {
  codec(prefix: string): HUSaveCodec;
  b64FromBytes(b: Uint8Array): string;
  bytesFromB64(str: string): Uint8Array;
}

interface Window {
  HUSave: HUSaveKit;
}

declare var HUSave: HUSaveKit;
