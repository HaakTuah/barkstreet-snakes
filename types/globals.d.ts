// What net.js and online.js see of the rest of the page, for `tsc --noEmit -p jsconfig.json`
// (a check only: nothing here is shipped or loaded). Hand-written, and only the fields
// online.js reads or writes: the engine itself isn't annotated. A field online.js starts
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
    leaps: number; leapArmed: number; restedAt: number; bank: number; shieldUntil: number; dashes: number; wrapUntil: number;
    flight: { dir: Dir; over: { x: number; y: number }[]; land: { x: number; y: number }; gold?: Flag; held?: Flag; flown?: number; path?: number[]; ring?: { x: number; y: number; n?: number } } | null;
    jumpHeld?: Flag; leapNow?: Flag; flyFor?: number; flyTurn?: { at: number; dir: Dir } | null; flew?: number; bumped?: boolean;
    flashArmed: number;
    /** A mushroom in its cheek (round six B): the segments it took, when it's spat, the ticks it had left to wilt. */
    cheek: { power: number; spitAt: number; left: number } | null;
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
    x: number; y: number; kind: 'food' | 'golden' | 'mushroom' | 'pellet' | 'leaf' | 'goldcap' | 'spill'; expires?: number;
    color?: string; heat?: number; cooked?: Flag; owner?: number;
    /** Spilled charges (round six B, part 6): the golden jumps and dashes a knocked-out snake held. */
    leaps?: number; dashes?: number;
    /** A mushroom come back up: the segments it takes (SHRINK when not set). */
    power?: number;
    /** Who spat it, and the tick from which that snake can swallow it again (before, it slides over it). */
    spitBy?: number; slideUntil?: number;
  }

  /** A beetle underground. */
  interface Under { until: number; expires: number; from: number; gold: boolean }
  interface Burrow { x: number; y: number; at: number; used?: number; dug?: number | boolean; shutFrom?: number; shutAt?: number }
  /** A gold portal (round six B, part 5): the entry, the way through it, the exit, whose, and when it shuts (0: its owner's body is still through it). */
  interface Portal { x: number; y: number; dx: number; dy: number; tx: number; ty: number; owner: number; shutAt: number; followed?: number[] }
  /** A mushroom in the air (3b+): where it is, which way it flies, the cells it has left, its strength, the ticks it'll lie, whose, over the edge or not. */
  interface Spit { x: number; y: number; fx?: number; fy?: number; dir: Dir; left: number; power: number; wilt: number; by: number; wrap: boolean }
  interface Fire { from: number; until: number; strike: boolean; ember?: boolean; group: number }
  interface Weather { kind: string; since: number; until: number }
  interface Woodpecker {
    x: number; y: number; at: number; target: number[]; strikeAt: number; last: number[];
    struckAt: number; restUntil: number; pecks?: number;
    /** Entry 6: the tick it came; pieces fallen in the frenzy; act 1's look (the cell it watches, and where it looked last after; the tick that look began; looks left; when it moves on, and a look's length, ms). */
    came: number; fury?: number; gaze: number; lookAt: number; looks: number; lookUntil: number; unit: number;
    /** Entry 6, part 2: its outline (the cut's cells left in peck order, the piece, the tick it began waiting or -1), and a fight's plus. (fury: pieces fallen in the frenzy.) */
    plan?: { cut: number[]; piece: number[]; waitFrom: number }; zone?: number[];
    /** [from, to] cells; to -1: the bird eats it. */
    landings?: [number, number][];
    /** 2s: the cells of the pieces its patch cuts loose (in target too): they fall with the strike. */
    fall?: number[];
  }

  /** The engine's events, as engine/step.js lists them above step(): just the fields online.js reads. */
  type Event =
    | { type: 'eat'; snake: Snake; kind: string; x: number; y: number; color?: string; cooked?: Flag; gold?: Flag }
    | { type: 'death'; snake: Snake }
    | { type: 'spawn'; kind: string; x?: number; y?: number; gold?: Flag }
    | { type: 'squash'; snake: Snake; x: number; y: number }
    | { type: 'spit'; snake: Snake; x: number; y: number; power: number }
    | { type: 'spat'; snake: Snake; x: number; y: number; fx: number; fy: number; power: number; hit: number; lx: number | null; ly: number | null }
    | { type: 'crash'; snake: Snake; x: number; y: number; cause: string; killer: string | null; killerId: number | null; lost: number; failed?: 1; air?: 1; shield?: 1 }
    | { type: 'leap'; snake: Snake; x: number; y: number; gold?: Flag; reach: number; now?: 1 }
    | { type: 'dash'; snake: Snake; x: number; y: number; n: number; plain?: Flag }
    | { type: 'fizzle'; snake: Snake; why: string; x: number; y: number; flash?: Flag }
    | { type: 'cut'; snake: Snake; x: number; y: number; lost: number; by?: number | null }
    | { type: 'knock'; kind: string; x: number; y: number; tx?: number | null; ty?: number | null; gold?: Flag; color?: string }
    | { type: 'dig'; x: number; y: number; until: number }
    | { type: 'shut'; x: number; y: number; at: number }
    | { type: 'portal' | 'through'; snake: Snake; x: number; y: number; tx: number; ty: number; owner?: number }
    | { type: 'portalShut'; x: number; y: number; tx: number; ty: number }
    | { type: 'dive' | 'burrow'; x: number; y: number; dug?: Flag }
    | { type: 'weather'; kind: string }
    | { type: 'ember'; x: number; y: number; fx: number; fy: number }
    | { type: 'woodpecker' }
    | { type: 'peck'; x: number; y: number; cells?: number[]; under?: number[]; fall?: number[]; zone?: number[] }
    | { type: 'rot'; x: number; y: number; kind: string; color?: string }
    | { type: 'spill'; snake: Snake; x: number; y: number; leaps: number; dashes: number }
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
    portals: Portal[];
    spits: Spit[];
    /** By cell. */
    fires: Map<number, Fire>;
    weather: Weather;
    /** The round's food season (2i): a key of TUNING.SEASONS. */
    season: 'lean' | 'normal' | 'plentiful';
    /** Entry 6: when the woodpecker's acts start, ms of game time (drawn by the host, or pinned by ?acts=). */
    acts: { watch: number; pecks: number; frenzy: number };
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
    on(event: 'iceStateChanged', fn: (state: RTCIceConnectionState) => void): void;
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
  TUNING: { GRID: number; SHRINK_MAX: number; SPIT_REACH: number; LEAP_MAX: number; DASH_MAX: number; SEASONS: Record<string, unknown> };
  // Made by these two files (their shapes are the files themselves).
  SnakeNet: unknown;
  SnakeOnline: unknown;
}
