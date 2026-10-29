// What net.js and online.js see of the rest of the page, for `tsc --noEmit -p jsconfig.json`
// (a check only: nothing here is shipped or loaded). Hand-written, and only the fields
// online.js reads or writes: engine.js itself isn't annotated. A field online.js starts
// reading goes in here too, or the check fails.

declare namespace Engine {
  /** A direction: one of the engine's four shared objects (`s.dir === DIRS.up` holds). */
  interface Dir { x: number; y: number }
  /** The engine's four directions, by name (DIR_NAMES's). */
  type Dirs = Record<string, Dir>;
  interface Cell { x: number; y: number }
  type Flag = boolean | number;

  /** What a snake remembers that a guest's renderer and chatter read (see online.js: MEMORY). */
  interface Memory {
    home?: Cell | null; colonies?: Cell[] | null; mood?: string | null; moodChangedAt?: number | null;
    modelId?: number | null; style?: string | null; victimId?: number | null; lureId?: number | null; site?: Cell | null;
    desperate?: boolean | null;
    /** The tick a rival asked to jump, and to flash, when it thought (plans). */
    power?: number | null; flash?: number | null;
    [k: string]: unknown;
  }

  interface Snake {
    id: number;
    alive: boolean;
    dir: Dir;
    body: Cell[];
    eaten: number; lastAte: number; nextStarve: number; mealMs: number;
    memory: Memory;
    /** A rival (the protocol's business only: plans say whose turns are queued presses). */
    isPlayer?: boolean;
    autopilot?: boolean;
    persona?: unknown; personaKey?: string;
    stunUntil: number; burnUntil: number; burnFrom: number;
    leaps: number; leapArmed: number; leapReadyAt: number; dashes: number; wrapUntil: number;
    flight: { dir: Dir; over: { x: number; y: number }[]; land: { x: number; y: number }; gold?: Flag } | null;
    flashReadyAt: number; flashArmed: number;
    coughUntil?: number;
    /** A rival's next way once it's thought, and the tick it thought it for; a person's queued turns. */
    planned?: Dir | null; plannedTick?: number; queue: Dir[];
    // How it died (set when it does: a death event reads them).
    cause: string; killer: string | null; killerId: number | null; diedAt: number; fatal: string | null;
  }

  /** A beetle (it walks) or anything else on the board (it rots, and can cook). */
  type Food = Beetle | Meal;
  interface Beetle {
    x: number; y: number; kind: 'beetle'; expires?: number;
    dir: Dir; px?: number; py?: number; movedAt: number; scared?: boolean; gold?: Flag; digUntil?: number;
  }
  interface Meal {
    x: number; y: number; kind: 'food' | 'golden' | 'mushroom' | 'pellet' | 'leaf' | 'goldcap'; expires?: number;
    color?: string; heat?: number; cooked?: Flag; owner?: number;
  }

  /** A beetle underground. */
  interface Under { until: number; expires: number; from: number; gold: boolean }
  interface Burrow { x: number; y: number; at: number; used?: number; dug?: number | boolean; shutFrom?: number; shutAt?: number }
  interface Fire { from: number; until: number; strike: boolean; ember?: boolean; group: number }
  interface Weather { kind: string; since: number; until: number }
  interface Woodpecker {
    x: number; y: number; at: number; target: number[]; strikeAt: number; last: number[];
    struckAt: number; restUntil: number; pecks?: number;
    /** [from, to] cells; to -1: the bird eats it. */
    landings?: [number, number][];
  }

  /** The engine's events, as engine.js lists them above step(): just the fields online.js reads. */
  type Event =
    | { type: 'eat'; snake: Snake; kind: string; x: number; y: number; color?: string; cooked?: Flag; gold?: Flag }
    | { type: 'death'; snake: Snake }
    | { type: 'spawn'; kind: string; x?: number; y?: number; gold?: Flag }
    | { type: 'choke'; snake: Snake; x: number; y: number; tx: number; ty: number }
    | { type: 'nudge'; snake: Snake; kind: string; x: number; y: number; tx: number; ty: number }
    | { type: 'crash'; snake: Snake; x: number; y: number; cause: string; killer: string | null; killerId: number | null; lost: number; failed?: 1 }
    | { type: 'leap'; snake: Snake; x: number; y: number; gold?: Flag; reach: number }
    | { type: 'dash'; snake: Snake; x: number; y: number; n: number; plain?: Flag }
    | { type: 'fizzle'; snake: Snake; why: string; x: number; y: number; flash?: Flag }
    | { type: 'cut'; snake: Snake; x: number; y: number; lost: number; by?: number | null }
    | { type: 'knock'; kind: string; x: number; y: number; tx?: number | null; ty?: number | null; gold?: Flag; color?: string }
    | { type: 'dig'; x: number; y: number; until: number }
    | { type: 'shut'; x: number; y: number; at: number }
    | { type: 'dive' | 'burrow'; x: number; y: number; dug?: Flag }
    | { type: 'weather'; kind: string }
    | { type: 'ember'; x: number; y: number; fx: number; fy: number }
    | { type: 'woodpecker' }
    | { type: 'peck'; x: number; y: number; cells?: number[]; under?: number[] }
    | { type: 'rot'; x: number; y: number; kind: string; color?: string }
    | { type: 'starving' | 'alight' | 'singe'; snake: Snake }
    | { type: 'baked' | 'ash'; x: number; y: number; kind: string }
    | { type: 'heal' | 'flown' | 'emerge' | 'gust' | 'charge' | 'strike' | 'rainbow' | 'aim' | 'douse' | 'lastApples'; x: number; y: number };

  interface Game {
    tick: number;
    time: number;
    snakes: Snake[];
    food: Food[];
    /** Cells (y * GRID + x), only ever added to, in order. */
    holes: Set<number>;
    unders?: Under[];
    woodpecker: Woodpecker | null;
    burrows: Burrow[];
    /** By cell. */
    fires: Map<number, Fire>;
    weather: Weather;
    events: Event[];
    /** Whether any rival was chosen, not dealt (set by the game, not the engine). */
    chosen?: boolean;
    /** The rivals dealt to it from the deck, and whether its round began (set by the game). */
    dealt?: string[];
    spent?: boolean;
  }
}

// PeerJS 1.5, just what net.js uses.
declare namespace PeerJS {
  interface Err { type?: string; message?: string }
  interface DataConnection {
    peer: string;
    open: boolean;
    send(data: unknown): void;
    close(): void;
    on(event: 'open' | 'close', fn: () => void): void;
    on(event: 'data', fn: (data: any) => void): void; // (whatever the other browser sent)
    on(event: 'error', fn: (err: Err) => void): void;
    once(event: 'open', fn: () => void): void;
  }
  interface Peer {
    id: string;
    destroyed: boolean;
    on(event: 'connection', fn: (conn: DataConnection) => void): void;
    on(event: 'disconnected', fn: () => void): void;
    on(event: 'error', fn: (err: Err) => void): void;
    once(event: 'open', fn: () => void): void;
    once(event: 'error', fn: (err: Err) => void): void;
    off(event: 'open', fn: () => void): void;
    off(event: 'error', fn: (err: Err) => void): void;
    connect(id: string, options: { serialization: 'json'; reliable: boolean }): DataConnection;
    reconnect(): void;
    destroy(): void;
  }
  interface Options { config: { iceServers: { urls: string; username?: string; credential?: string }[] }; debug: number }
  type PeerClass = { new (options: Options): Peer; new (id: string, options: Options): Peer };
}

interface Window {
  Peer?: PeerJS.PeerClass;
  SnakeAI: { PERSONAS: Record<string, unknown> };
  SnakeRecords: { cleanName(text: unknown): string };
  TUNING: { GRID: number };
  // Made by these two files (their shapes are the files themselves).
  SnakeNet: unknown;
  SnakeOnline: unknown;
}
