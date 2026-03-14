<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Application, Graphics, Text, TextStyle } from 'pixi.js';
  import { theme, darkMode } from '../stores/settings';
  import { activePopup, openPopup, closePopup } from '../stores/popup';
  import MainMenuPopup  from './MainMenuPopup.svelte';
  import CVPopup        from './CVPopup.svelte';
  import HobbiesPopup   from './HobbiesPopup.svelte';
  import PinboardPopup  from './PinboardPopup.svelte';

  export let configJson:       string = '{}';
  export let translationsJson: string = '{}';
  export let landingUrl:       string = '/';

  // ── Scene constants (all drawing at this virtual resolution) ─────────────
  const SW = 1200, SH = 750;
  const WALL_H = 575;

  // Window (back-left)
  const WIN_X = 65, WIN_Y = 20, WIN_W = 268, WIN_H = 382;
  const GLS_X = 80,  GLS_Y = 35,  GLS_W = 238, GLS_H = 348;

  // Nameplate (center-top)
  const PL_X = 432, PL_Y = 22, PL_W = 332, PL_H = 208;

  // Clock
  const CLK_CX = 842, CLK_CY = 103, CLK_R = 62;

  // Shelf (top-right)
  const SH_X = 948, SH_Y = 52, SH_W = 218, SH_H = 18;

  // Corkboard (right side)
  const CK_X = 942, CK_Y = 86, CK_W = 224, CK_H = 290;

  // Desk
  const DK_X = 72,  DK_Y = 496, DK_W = 1056, DK_H = 79;
  const DK_FRONT_Y = DK_Y + DK_H;   // 575
  const DK_FRONT_H = 82;
  const DRWR_W = 118;

  // Monitor
  const MN_X = 447, MN_Y = 280, MN_W = 306, MN_H = 220;
  const SC_X = 477, SC_Y = 304, SC_W = 246, SC_H = 162;

  // Keyboard
  const KB_X = 394, KB_Y = 513, KB_W = 216, KB_H = 54;

  // Mouse
  const MS_X = 624, MS_Y = 524, MS_W = 54, MS_H = 36;

  // Mug
  const MG_X = 302, MG_Y = 492, MG_W = 58, MG_H = 72;

  // Lamp base
  const LMP_X = 726, LMP_Y = 491, LMP_W = 48;

  // Chair
  const CHR_BK_X = 498, CHR_BK_Y = 582, CHR_BK_W = 204, CHR_BK_H = 118;
  const CHR_ST_X = 476, CHR_ST_Y = 692, CHR_ST_W = 248, CHR_ST_H = 54;

  // Trash can
  const TR_X = 56, TR_Y = 662, TR_W = 76, TR_H = 85;

  // ── State ─────────────────────────────────────────────────────────────────
  let containerEl: HTMLDivElement;
  let app: Application;
  let config: any  = {};
  let ro: ResizeObserver;

  let hoverZone: string | null = null;
  let matrixTick = 0;

  // Pre-computed star positions within window glass
  const starPos: Array<[number, number, number]> = [];

  // Matrix rain columns (within CRT screen)
  const CELL = 8;
  interface MCol { x: number; y: number; speed: number; len: number }
  const matrixCols: MCol[] = [];

  // Corkboard note rects (randomised once)
  const corkNotes: Array<{ x: number; y: number; w: number; h: number; ci: number }> = [];

  // ── Color palette ─────────────────────────────────────────────────────────
  interface C {
    backWall: number; ceiling: number; wood: number; woodLight: number;
    floor: number;    floorPlank: number; windowFrame: number; windowSill: number;
    crtPlastic: number; crtScreen: number; nameplate: number; plateBorder: number;
    cork: number; corkNotes: number[]; deskSurface: number; deskFront: number;
    drawerUnit: number; matrixCol: number; matrixBright: number;
    shelf: number; chair: number; chairDark: number;
    lampShade: number; lampArm: number; keyboard: number; mug: number; trash: number;
  }

  function getColors(th: string): C {
    if (th === 'cool') return {
      backWall: 0x18222e, ceiling: 0x101828,
      wood: 0x2a3c52, woodLight: 0x3a5068,
      floor: 0x1e2c3a, floorPlank: 0x263448,
      windowFrame: 0x1a2840, windowSill: 0x3a5068,
      crtPlastic: 0xbcc8d4, crtScreen: 0x020810,
      nameplate: 0xbeccd8, plateBorder: 0x3a5068,
      cork: 0x486278, corkNotes: [0xd0e4f0, 0xf0d0e4, 0xd0f0e0, 0xf0f0d0],
      deskSurface: 0x28384c, deskFront: 0x1e2c3e, drawerUnit: 0x20303e,
      matrixCol: 0x0077ee, matrixBright: 0x77ccff,
      shelf: 0x2a3c52, chair: 0x1e2c3e, chairDark: 0x162234,
      lampShade: 0x4080b0, lampArm: 0x30404e, keyboard: 0xbcc8d4, mug: 0xd0dce8, trash: 0x283846,
    };
    if (th === 'mono') return {
      backWall: 0x181818, ceiling: 0x101010,
      wood: 0x282828, woodLight: 0x383838,
      floor: 0x222222, floorPlank: 0x2e2e2e,
      windowFrame: 0x1e1e1e, windowSill: 0x383838,
      crtPlastic: 0xd0d0d0, crtScreen: 0x060606,
      nameplate: 0xd4d4d4, plateBorder: 0x383838,
      cork: 0x585858, corkNotes: [0xe0e0e0, 0xd0d0d0, 0xe8e8e8, 0xc8c8c8],
      deskSurface: 0x303030, deskFront: 0x282828, drawerUnit: 0x242424,
      matrixCol: 0x707070, matrixBright: 0xd0d0d0,
      shelf: 0x2a2a2a, chair: 0x282828, chairDark: 0x202020,
      lampShade: 0x606060, lampArm: 0x404040, keyboard: 0xd0d0d0, mug: 0xe0e0d8, trash: 0x303030,
    };
    // warm (default)
    return {
      backWall: 0x2a2218, ceiling: 0x1e1810,
      wood: 0x5c3a1e, woodLight: 0x7a4e2a,
      floor: 0x7a5030, floorPlank: 0x8b6040,
      windowFrame: 0x3d2510, windowSill: 0x7a4e2a,
      crtPlastic: 0xd4c9a8, crtScreen: 0x0a1a08,
      nameplate: 0xe8d8a0, plateBorder: 0xb89050,
      cork: 0xc8a060, corkNotes: [0xf5f0b0, 0xffd0d0, 0xc8f0c8, 0xd0d8ff],
      deskSurface: 0x8b5e2a, deskFront: 0x6a4620, drawerUnit: 0x5c3a1e,
      matrixCol: 0x00cc44, matrixBright: 0x88ff88,
      shelf: 0x5c3a1e, chair: 0x3a2418, chairDark: 0x2a1a10,
      lampShade: 0xe8d050, lampArm: 0x484040, keyboard: 0xd4c9a8, mug: 0xeeeedd, trash: 0x4a3018,
    };
  }

  // ── Colour lerp helper ────────────────────────────────────────────────────
  function lerp(a: number, b: number, t: number): number {
    const ar = (a >> 16) & 0xff, ag = (a >> 8) & 0xff, ab = a & 0xff;
    const br = (b >> 16) & 0xff, bg = (b >> 8) & 0xff, bb = b & 0xff;
    return ((Math.round(ar + (br - ar) * t) << 16) |
            (Math.round(ag + (bg - ag) * t) << 8)  |
             Math.round(ab + (bb - ab) * t));
  }

  // ── Drawing helpers ───────────────────────────────────────────────────────
  function sky(gfx: Graphics, dk: boolean) {
    const bands = 8;
    for (let i = 0; i < bands; i++) {
      const t = i / bands;
      const by = GLS_Y + t * (GLS_H - 60);
      const bh = (GLS_H - 60) / bands + 1;
      const col = dk
        ? lerp(0x06061a, 0x141030, t)
        : lerp(0xffaa44, 0x3366cc, t);
      gfx.rect(GLS_X, by, GLS_W, bh).fill({ color: col });
    }
    // Ground strip at bottom of window
    gfx.rect(GLS_X, GLS_Y + GLS_H - 62, GLS_W, 62)
       .fill({ color: dk ? 0x0d1508 : 0x1a2e08 });
  }

  // ── Static scene ──────────────────────────────────────────────────────────
  function drawRoom(g: Graphics, c: C) {
    // Ceiling
    g.rect(0, 0, SW, 28).fill({ color: c.ceiling });
    // Back wall
    g.rect(0, 28, SW, WALL_H - 28).fill({ color: c.backWall });
    // Left wall shadow panel
    g.poly([0, 28, 95, 28, 95, WALL_H, 0, WALL_H]).fill({ color: lerp(c.backWall, 0x000000, 0.22) });
    // Right wall shadow panel
    g.poly([SW - 95, 28, SW, 28, SW, WALL_H, SW - 95, WALL_H]).fill({ color: lerp(c.backWall, 0x000000, 0.18) });
    // Subtle wall grain lines
    for (let i = 0; i < 8; i++) {
      const gx = 100 + i * 128;
      g.moveTo(gx, 28).lineTo(gx, WALL_H);
      g.stroke({ color: lerp(c.backWall, 0x000000, 0.12), width: 1 });
    }
  }

  function drawFloor(g: Graphics, c: C) {
    g.rect(0, WALL_H, SW, SH - WALL_H).fill({ color: c.floor });
    // Floor planks (horizontal lines)
    const plankH = 22;
    const plankCount = Math.ceil((SH - WALL_H) / plankH);
    for (let i = 0; i < plankCount; i++) {
      const py = WALL_H + i * plankH;
      g.rect(0, py, SW, plankH - 2).fill({ color: i % 2 === 0 ? c.floorPlank : c.floor });
      // Subtle wood grain on every other plank
      if (i % 2 === 0) {
        g.moveTo(0, py + plankH - 2).lineTo(SW, py + plankH - 2);
        g.stroke({ color: lerp(c.floor, 0x000000, 0.25), width: 1 });
      }
    }
    // Floor fade at wall/floor boundary
    for (let i = 0; i < 10; i++) {
      const t = i / 10;
      g.rect(0, WALL_H + i * 2, SW, 2).fill({ color: lerp(c.backWall, c.floor, t), alpha: 0.5 });
    }
  }

  function drawWindow(g: Graphics, c: C, dk: boolean) {
    // Outer frame (wood)
    g.roundRect(WIN_X, WIN_Y, WIN_W, WIN_H, 3).fill({ color: c.windowFrame });
    // Sky
    sky(g, dk);
    // Day: sun
    if (!dk) {
      g.circle(260, 70, 22).fill({ color: 0xffdd44, alpha: 0.9 });
      g.circle(260, 70, 30).fill({ color: 0xffee88, alpha: 0.3 });
    }
    // Night: stars
    if (dk) {
      for (const [sx, sy, sr] of starPos) {
        g.circle(sx, sy, sr).fill({ color: 0xffffff, alpha: 0.65 });
      }
    }
    // Tree trunk
    g.rect(188, GLS_Y + GLS_H - 100, 14, 52).fill({ color: 0x1a0e04 });
    // Tree canopy layers (triangles - draw back-to-front)
    const ty = GLS_Y;
    g.poly([GLS_X + 8, GLS_Y + GLS_H - 60,
            195,        ty + 90,
            GLS_X + GLS_W - 8, GLS_Y + GLS_H - 60]).fill({ color: dk ? 0x050c04 : 0x0e1f08, alpha: 0.9 });
    g.poly([GLS_X + 22, GLS_Y + GLS_H - 90,
            195,         ty + 60,
            GLS_X + GLS_W - 22, GLS_Y + GLS_H - 90]).fill({ color: dk ? 0x070e05 : 0x12250a });
    g.poly([GLS_X + 38, GLS_Y + GLS_H - 118,
            195,          ty + 36,
            GLS_X + GLS_W - 38, GLS_Y + GLS_H - 118]).fill({ color: dk ? 0x09100a : 0x162c0c });
    // Day: car silhouette in distance
    if (!dk) {
      g.roundRect(200, GLS_Y + GLS_H - 44, 48, 14, 2).fill({ color: 0x2a3848 });
      g.roundRect(207, GLS_Y + GLS_H - 54, 30, 12, 2).fill({ color: 0x1e2c38 });
      g.circle(210, GLS_Y + GLS_H - 32, 5).fill({ color: 0x181820 });
      g.circle(237, GLS_Y + GLS_H - 32, 5).fill({ color: 0x181820 });
    }
    // Window cross-bars (dividers)
    g.moveTo(WIN_X + 14, WIN_Y + WIN_H / 2).lineTo(WIN_X + WIN_W - 14, WIN_Y + WIN_H / 2);
    g.stroke({ color: c.windowFrame, width: 9 });
    g.moveTo(WIN_X + WIN_W / 2, WIN_Y + 14).lineTo(WIN_X + WIN_W / 2, WIN_Y + WIN_H - 14);
    g.stroke({ color: c.windowFrame, width: 9 });
    // Frame inner border
    g.roundRect(WIN_X, WIN_Y, WIN_W, WIN_H, 3).stroke({ color: lerp(c.windowFrame, 0xffffff, 0.1), width: 2 });
    // Windowsill
    g.roundRect(WIN_X - 4, WIN_Y + WIN_H - 4, WIN_W + 8, 20, 2).fill({ color: c.windowSill });
    g.roundRect(WIN_X - 4, WIN_Y + WIN_H - 4, WIN_W + 8, 20, 2).stroke({ color: lerp(c.windowSill, 0x000000, 0.3), width: 1 });
  }

  function drawNameplate(g: Graphics, c: C) {
    // Outer frame (wood)
    g.roundRect(PL_X, PL_Y, PL_W, PL_H, 5).fill({ color: c.plateBorder });
    // Parchment background
    g.roundRect(PL_X + 8, PL_Y + 8, PL_W - 16, PL_H - 16, 3).fill({ color: c.nameplate });
    // Inner border double-line
    g.roundRect(PL_X + 14, PL_Y + 14, PL_W - 28, PL_H - 28, 2).stroke({ color: lerp(c.plateBorder, 0x000000, 0.3), width: 1.5 });
    g.roundRect(PL_X + 18, PL_Y + 18, PL_W - 36, PL_H - 36, 2).stroke({ color: lerp(c.plateBorder, 0x000000, 0.2), width: 1 });
    // Decorative seal symbol (rendered as horizontal lines suggesting text)
    const lx = PL_X + 40, lw = PL_W - 80;
    const textLineColor = lerp(c.plateBorder, 0x000000, 0.45);
    // Title line (thick)
    g.rect(lx, PL_Y + 48, lw, 7).fill({ color: textLineColor, alpha: 0.7 });
    // Sub-title line
    g.rect(lx + 20, PL_Y + 64, lw - 40, 5).fill({ color: textLineColor, alpha: 0.5 });
    // Horizontal rule
    g.moveTo(lx - 10, PL_Y + 84).lineTo(lx + lw + 10, PL_Y + 84);
    g.stroke({ color: lerp(c.plateBorder, 0x000000, 0.4), width: 1.5 });
    // Body text lines
    for (let i = 0; i < 3; i++) {
      const llen = i === 1 ? lw - 60 : lw - 30;
      g.rect(lx + (i === 1 ? 30 : 0), PL_Y + 100 + i * 22, llen, 4).fill({ color: textLineColor, alpha: 0.4 });
    }
    // Decorative corner ornaments
    const orn = 0xe8a040;
    for (const [ox, oy] of [[PL_X + 24, PL_Y + 24], [PL_X + PL_W - 38, PL_Y + 24],
                            [PL_X + 24, PL_Y + PL_H - 38], [PL_X + PL_W - 38, PL_Y + PL_H - 38]]) {
      g.circle(ox + 7, oy + 7, 5).fill({ color: c.plateBorder });
    }
  }

  function drawClock(g: Graphics, c: C) {
    const now = new Date();
    const h   = now.getHours() % 12;
    const m   = now.getMinutes();
    const s   = now.getSeconds();

    // Face
    g.circle(CLK_CX, CLK_CY, CLK_R + 4).fill({ color: c.wood });
    g.circle(CLK_CX, CLK_CY, CLK_R).fill({ color: 0xf5f0e8 });
    g.circle(CLK_CX, CLK_CY, CLK_R).stroke({ color: lerp(c.wood, 0x000000, 0.3), width: 2 });

    // Hour marks
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
      const len = i % 3 === 0 ? CLK_R * 0.18 : CLK_R * 0.1;
      const x1 = CLK_CX + Math.cos(a) * (CLK_R - 4);
      const y1 = CLK_CY + Math.sin(a) * (CLK_R - 4);
      g.moveTo(x1, y1).lineTo(CLK_CX + Math.cos(a) * (CLK_R - 4 - len), CLK_CY + Math.sin(a) * (CLK_R - 4 - len));
      g.stroke({ color: 0x2a1808, width: i % 3 === 0 ? 3 : 1.5 });
    }

    // Hour hand
    const ha = ((h + m / 60) / 12) * Math.PI * 2 - Math.PI / 2;
    g.moveTo(CLK_CX, CLK_CY)
     .lineTo(CLK_CX + Math.cos(ha) * CLK_R * 0.52, CLK_CY + Math.sin(ha) * CLK_R * 0.52);
    g.stroke({ color: 0x1a0a04, width: 4 });

    // Minute hand
    const ma = ((m + s / 60) / 60) * Math.PI * 2 - Math.PI / 2;
    g.moveTo(CLK_CX, CLK_CY)
     .lineTo(CLK_CX + Math.cos(ma) * CLK_R * 0.72, CLK_CY + Math.sin(ma) * CLK_R * 0.72);
    g.stroke({ color: 0x2a1808, width: 2.5 });

    // Second hand
    const sa = (s / 60) * Math.PI * 2 - Math.PI / 2;
    g.moveTo(CLK_CX, CLK_CY)
     .lineTo(CLK_CX + Math.cos(sa) * CLK_R * 0.85, CLK_CY + Math.sin(sa) * CLK_R * 0.85);
    g.stroke({ color: 0xcc2222, width: 1.5 });

    // Centre dot
    g.circle(CLK_CX, CLK_CY, 5).fill({ color: 0x1a0a04 });
  }

  function drawShelf(g: Graphics, c: C) {
    // Wall bracket mounts
    g.roundRect(SH_X + 10,         SH_Y + SH_H, 14, 36, 2).fill({ color: lerp(c.shelf, 0x000000, 0.3) });
    g.roundRect(SH_X + SH_W - 24,  SH_Y + SH_H, 14, 36, 2).fill({ color: lerp(c.shelf, 0x000000, 0.3) });
    // Shelf plank
    g.roundRect(SH_X, SH_Y, SH_W, SH_H, 2).fill({ color: c.shelf });
    g.roundRect(SH_X, SH_Y, SH_W, SH_H, 2).stroke({ color: lerp(c.shelf, 0x000000, 0.35), width: 1.5 });
    // Shelf shadow
    g.rect(SH_X, SH_Y + SH_H, SH_W, 5).fill({ color: 0x000000, alpha: 0.2 });

    // Books (colourful spines)
    const books = [
      { x: SH_X + 12,  w: 22, h: 40, col: 0x8b2020 },
      { x: SH_X + 36,  w: 18, h: 36, col: 0x204580 },
      { x: SH_X + 56,  w: 24, h: 44, col: 0x206020 },
      { x: SH_X + 82,  w: 16, h: 32, col: 0x806020 },
      { x: SH_X + 100, w: 20, h: 42, col: 0x602080 },
      { x: SH_X + 122, w: 18, h: 35, col: 0x208060 },
      { x: SH_X + 142, w: 22, h: 38, col: 0xc05020 },
    ];
    for (const b of books) {
      g.rect(b.x, SH_Y - b.h, b.w, b.h).fill({ color: b.col });
      g.rect(b.x, SH_Y - b.h, b.w, b.h).stroke({ color: lerp(b.col, 0x000000, 0.3), width: 1 });
      // Book spine line
      g.moveTo(b.x + 4, SH_Y - b.h + 4).lineTo(b.x + 4, SH_Y - 4);
      g.stroke({ color: lerp(b.col, 0xffffff, 0.2), width: 1 });
    }
    // Small toy car on shelf
    g.roundRect(SH_X + 168, SH_Y - 14, 36, 12, 2).fill({ color: 0xcc4422 });
    g.roundRect(SH_X + 174, SH_Y - 22, 24,  9, 2).fill({ color: 0xaa3318 });
    g.circle(SH_X + 175, SH_Y - 2, 4).fill({ color: 0x202020 });
    g.circle(SH_X + 197, SH_Y - 2, 4).fill({ color: 0x202020 });
  }

  function drawCorkboard(g: Graphics, c: C) {
    // Frame
    g.roundRect(CK_X - 4, CK_Y - 4, CK_W + 8, CK_H + 8, 4).fill({ color: c.wood });
    // Cork surface
    g.roundRect(CK_X, CK_Y, CK_W, CK_H, 2).fill({ color: c.cork });
    // Cork texture (small dots grid)
    for (let cx2 = CK_X + 10; cx2 < CK_X + CK_W - 8; cx2 += 16) {
      for (let cy2 = CK_Y + 10; cy2 < CK_Y + CK_H - 8; cy2 += 16) {
        g.circle(cx2, cy2, 1.5).fill({ color: lerp(c.cork, 0x000000, 0.18), alpha: 0.6 });
      }
    }
    // Pinned notes
    for (const note of corkNotes) {
      g.roundRect(note.x, note.y, note.w, note.h, 2)
       .fill({ color: c.corkNotes[note.ci % c.corkNotes.length] });
      g.roundRect(note.x, note.y, note.w, note.h, 2)
       .stroke({ color: lerp(c.corkNotes[note.ci % c.corkNotes.length], 0x000000, 0.2), width: 1 });
      // Pin dot
      g.circle(note.x + note.w / 2, note.y + 5, 3).fill({ color: 0xff4040 });
      // Text lines on note
      for (let l = 0; l < 3; l++) {
        g.rect(note.x + 6, note.y + 14 + l * 8, note.w - 12, 3)
         .fill({ color: 0x808080, alpha: 0.35 });
      }
    }
  }

  function drawDesk(g: Graphics, c: C) {
    // Drawer unit (left side, full height)
    g.rect(DK_X, DK_Y, DRWR_W, DK_H + DK_FRONT_H).fill({ color: c.drawerUnit });
    // Three drawers
    for (let d = 0; d < 3; d++) {
      const dy = DK_Y + 12 + d * (DK_H + DK_FRONT_H - 24) / 3;
      const dh = (DK_H + DK_FRONT_H - 36) / 3;
      g.roundRect(DK_X + 8, dy, DRWR_W - 16, dh, 2).fill({ color: lerp(c.drawerUnit, 0xffffff, 0.08) });
      g.roundRect(DK_X + 8, dy, DRWR_W - 16, dh, 2).stroke({ color: lerp(c.drawerUnit, 0x000000, 0.25), width: 1 });
      // Drawer handle
      g.roundRect(DK_X + DRWR_W / 2 - 12, dy + dh / 2 - 4, 24, 8, 3)
       .fill({ color: lerp(c.woodLight, 0xffffff, 0.15) });
    }
    // Desk top surface
    g.rect(DK_X, DK_Y, DK_W, DK_H).fill({ color: c.deskSurface });
    // Desk edge highlight
    g.rect(DK_X, DK_Y, DK_W, 4).fill({ color: lerp(c.deskSurface, 0xffffff, 0.15) });
    // Desk top shadow near wall
    g.rect(DK_X, DK_Y + DK_H - 6, DK_W, 6).fill({ color: lerp(c.deskSurface, 0x000000, 0.2) });
    // Desk front face
    g.rect(DK_X, DK_FRONT_Y, DK_W, DK_FRONT_H).fill({ color: c.deskFront });
    // Desk front bottom edge
    g.rect(DK_X, DK_FRONT_Y + DK_FRONT_H - 6, DK_W, 6)
     .fill({ color: lerp(c.deskFront, 0x000000, 0.3) });
    // Right leg
    g.rect(DK_X + DK_W - 30, DK_FRONT_Y, 30, DK_FRONT_H).fill({ color: lerp(c.deskFront, 0x000000, 0.15) });
  }

  function drawPapers(g: Graphics, c: C) {
    // A notebook / papers scattered on desk left side
    g.rect(156, 500, 90, 64).fill({ color: 0xf0ead8 });
    g.rect(156, 500, 90, 64).stroke({ color: 0xc0b898, width: 1 });
    // Notebook lines
    for (let i = 0; i < 4; i++) {
      g.moveTo(162, 512 + i * 12).lineTo(238, 512 + i * 12);
      g.stroke({ color: 0xaaaacc, width: 1 });
    }
    // Spiral
    g.rect(160, 500, 6, 64).fill({ color: 0xd0d0e0 });
    // Paper stack
    g.rect(178, 496, 78, 52).fill({ color: 0xf8f5ee });
    g.rect(182, 492, 78, 52).fill({ color: 0xf0ead8 });
    g.rect(186, 488, 78, 52).fill({ color: 0xf5f0e8 });
    // Paper lines
    for (let i = 0; i < 4; i++) {
      g.moveTo(192, 498 + i * 10).lineTo(256, 498 + i * 10);
      g.stroke({ color: 0x8888aa, width: 0.8 });
    }
  }

  function drawMonitorBody(g: Graphics, c: C) {
    // CRT shadow
    g.roundRect(MN_X + 6, MN_Y + 6, MN_W, MN_H, 6).fill({ color: 0x000000, alpha: 0.3 });
    // CRT plastic housing
    g.roundRect(MN_X, MN_Y, MN_W, MN_H, 6).fill({ color: c.crtPlastic });
    // Plastic highlight top
    g.roundRect(MN_X, MN_Y, MN_W, 8, 6).fill({ color: lerp(c.crtPlastic, 0xffffff, 0.25), alpha: 0.6 });
    // Screen bezel (recessed, darker)
    g.roundRect(SC_X - 14, SC_Y - 14, SC_W + 28, SC_H + 28, 4)
     .fill({ color: lerp(c.crtPlastic, 0x000000, 0.35) });
    // Screen surface
    g.rect(SC_X, SC_Y, SC_W, SC_H).fill({ color: c.crtScreen });
    // Scanline overlay for depth
    for (let row = 0; row < SC_H; row += 3) {
      g.rect(SC_X, SC_Y + row, SC_W, 1).fill({ color: 0x000000, alpha: 0.18 });
    }
    // CRT bottom controls strip
    g.roundRect(MN_X + 10, MN_Y + MN_H - 28, MN_W - 20, 20, 3)
     .fill({ color: lerp(c.crtPlastic, 0x000000, 0.12) });
    // Power button
    g.circle(MN_X + MN_W - 28, MN_Y + MN_H - 18, 6).fill({ color: lerp(c.crtPlastic, 0x004400, 0.5) });
    g.circle(MN_X + MN_W - 28, MN_Y + MN_H - 18, 4).fill({ color: 0x22cc22 });
    // Monitor base stand
    g.roundRect(MN_X + MN_W / 2 - 40, MN_Y + MN_H - 4, 80, 10, 2)
     .fill({ color: lerp(c.crtPlastic, 0x000000, 0.25) });
    g.roundRect(MN_X + MN_W / 2 - 52, MN_Y + MN_H + 4, 104, 8, 2)
     .fill({ color: lerp(c.crtPlastic, 0x000000, 0.35) });
  }

  function drawKeyboard(g: Graphics, c: C) {
    // Shadow
    g.rect(KB_X + 4, KB_Y + 4, KB_W, KB_H).fill({ color: 0x000000, alpha: 0.2 });
    // Keyboard body
    g.roundRect(KB_X, KB_Y, KB_W, KB_H, 4).fill({ color: c.keyboard });
    // Key rows (3 rows of key blocks)
    const rows = [
      { count: 13, ky: KB_Y + 8,  kw: 14, kh: 11 },
      { count: 12, ky: KB_Y + 22, kw: 15, kh: 11 },
      { count: 10, ky: KB_Y + 36, kw: 18, kh: 11 },
    ];
    for (const row of rows) {
      const totalW = row.count * (row.kw + 2);
      const startX = KB_X + (KB_W - totalW) / 2;
      for (let k = 0; k < row.count; k++) {
        const kx = startX + k * (row.kw + 2);
        g.roundRect(kx, row.ky, row.kw, row.kh, 1)
         .fill({ color: lerp(c.keyboard, 0x000000, 0.18) });
      }
    }
    // Space bar
    g.roundRect(KB_X + 48, KB_Y + 38, 120, 11, 1).fill({ color: lerp(c.keyboard, 0x000000, 0.2) });
  }

  function drawMouse(g: Graphics, c: C) {
    g.roundRect(MS_X, MS_Y, MS_W, MS_H, MS_W / 2).fill({ color: c.keyboard });
    g.moveTo(MS_X + MS_W / 2, MS_Y + 6).lineTo(MS_X + MS_W / 2, MS_Y + MS_H * 0.55);
    g.stroke({ color: lerp(c.keyboard, 0x000000, 0.25), width: 1.5 });
    // Scroll wheel
    g.roundRect(MS_X + MS_W / 2 - 4, MS_Y + 10, 8, 10, 3).fill({ color: lerp(c.keyboard, 0x000000, 0.3) });
  }

  function drawMug(g: Graphics, c: C) {
    // Shadow
    g.circle(MG_X + MG_W / 2 + 3, MG_Y + MG_H + 3, MG_W * 0.4).fill({ color: 0x000000, alpha: 0.15 });
    // Mug body
    g.roundRect(MG_X, MG_Y + 14, MG_W, MG_H - 14, 4).fill({ color: c.mug });
    // Mug rim (top)
    g.ellipse(MG_X + MG_W / 2, MG_Y + 14, MG_W / 2, 7).fill({ color: lerp(c.mug, 0xffffff, 0.15) });
    // Handle
    g.roundRect(MG_X + MG_W - 4, MG_Y + 26, 18, 30, 8).stroke({ color: lerp(c.mug, 0x000000, 0.2), width: 5 });
    // Steam wisps (animated via matrixTick)
    for (let si = 0; si < 3; si++) {
      const phase = (matrixTick * 0.02 + si * 0.8);
      const sx = MG_X + 14 + si * 12 + Math.sin(phase) * 4;
      const sy = MG_Y - ((matrixTick * 0.4 + si * 14) % 28);
      const alpha = 0.12 + 0.1 * Math.sin(phase);
      g.roundRect(sx - 2, sy - 6, 5, 12, 2).fill({ color: 0xffffff, alpha: Math.max(0, alpha) });
    }
  }

  function drawLamp(g: Graphics, c: C) {
    // Base
    g.roundRect(LMP_X, LMP_Y, LMP_W, 14, 3).fill({ color: lerp(c.woodLight, 0x888888, 0.4) });
    // Arm post (vertical)
    g.moveTo(LMP_X + LMP_W / 2, LMP_Y).lineTo(LMP_X + LMP_W / 2, LMP_Y - 50);
    g.stroke({ color: c.lampArm, width: 5 });
    // Arm elbow
    g.moveTo(LMP_X + LMP_W / 2, LMP_Y - 50).lineTo(LMP_X + LMP_W / 2 + 32, LMP_Y - 60);
    g.stroke({ color: c.lampArm, width: 5 });
    // Shade (trapezoid cone)
    const sx2 = LMP_X + LMP_W / 2 + 32;
    const sy2 = LMP_Y - 60;
    g.poly([sx2 - 18, sy2, sx2 + 20, sy2, sx2 + 28, sy2 + 24, sx2 - 26, sy2 + 24]).fill({ color: c.lampShade });
    // Glow circle (warm light spill)
    g.circle(sx2 + 1, sy2 + 30, 34).fill({ color: 0xffee88, alpha: 0.08 });
    // Shade underlight
    g.circle(sx2 + 1, sy2 + 22, 12).fill({ color: 0xffffff, alpha: 0.15 });
  }

  function drawChair(g: Graphics, c: C) {
    // Chair shadow on floor
    g.roundRect(CHR_ST_X + 10, CHR_ST_Y + CHR_ST_H + 4, CHR_ST_W - 20, 12, 5)
     .fill({ color: 0x000000, alpha: 0.2 });
    // Chair back
    g.roundRect(CHR_BK_X, CHR_BK_Y, CHR_BK_W, CHR_BK_H, 10).fill({ color: c.chair });
    // Chair back padding panel
    g.roundRect(CHR_BK_X + 12, CHR_BK_Y + 10, CHR_BK_W - 24, CHR_BK_H - 20, 6)
     .fill({ color: lerp(c.chair, 0xffffff, 0.1) });
    // Headrest
    g.roundRect(CHR_BK_X + 20, CHR_BK_Y - 24, CHR_BK_W - 40, 32, 8)
     .fill({ color: c.chair });
    g.roundRect(CHR_BK_X + 28, CHR_BK_Y - 18, CHR_BK_W - 56, 20, 6)
     .fill({ color: lerp(c.chair, 0xffffff, 0.1) });
    // Armrests
    g.roundRect(CHR_BK_X - 16, CHR_BK_Y + 30, 20, 58, 4).fill({ color: c.chairDark });
    g.roundRect(CHR_BK_X + CHR_BK_W - 4, CHR_BK_Y + 30, 20, 58, 4).fill({ color: c.chairDark });
    // Chair seat
    g.roundRect(CHR_ST_X, CHR_ST_Y, CHR_ST_W, CHR_ST_H, 8).fill({ color: c.chair });
    g.roundRect(CHR_ST_X + 10, CHR_ST_Y + 6, CHR_ST_W - 20, CHR_ST_H - 12, 6)
     .fill({ color: lerp(c.chair, 0xffffff, 0.1) });
    // Centre pole
    g.rect(CHR_ST_X + CHR_ST_W / 2 - 5, CHR_ST_Y + CHR_ST_H, 10, 28).fill({ color: c.chairDark });
    // Base with 5 spokes
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      const bx = CHR_ST_X + CHR_ST_W / 2, by = CHR_ST_Y + CHR_ST_H + 28;
      g.moveTo(bx, by).lineTo(bx + Math.cos(angle) * 36, by + Math.sin(angle) * 14);
      g.stroke({ color: c.chairDark, width: 4 });
      g.circle(bx + Math.cos(angle) * 36, by + Math.sin(angle) * 14, 4)
       .fill({ color: lerp(c.chairDark, 0x000000, 0.3) });
    }
  }

  function drawTrashCan(g: Graphics, c: C) {
    // Cylinder body (trapezoid - slightly wider at top)
    g.poly([TR_X + 4, TR_Y, TR_X + TR_W - 4, TR_Y,
            TR_X + TR_W, TR_Y + TR_H, TR_X, TR_Y + TR_H]).fill({ color: c.trash });
    // Vertical stripes
    g.moveTo(TR_X + TR_W * 0.33, TR_Y + 10).lineTo(TR_X + TR_W * 0.33, TR_Y + TR_H);
    g.stroke({ color: lerp(c.trash, 0x000000, 0.2), width: 1.5 });
    g.moveTo(TR_X + TR_W * 0.66, TR_Y + 10).lineTo(TR_X + TR_W * 0.66, TR_Y + TR_H);
    g.stroke({ color: lerp(c.trash, 0x000000, 0.2), width: 1.5 });
    // Rim
    g.roundRect(TR_X - 2, TR_Y - 6, TR_W + 4, 12, 2).fill({ color: lerp(c.trash, 0xffffff, 0.1) });
    // Crumpled paper sticking out
    g.circle(TR_X + 22, TR_Y - 4, 8).fill({ color: 0xf0ead8, alpha: 0.8 });
    g.circle(TR_X + 38, TR_Y - 6, 6).fill({ color: 0xeee8d8, alpha: 0.7 });
    // Floor shadow
    g.ellipse(TR_X + TR_W / 2, TR_Y + TR_H + 3, TR_W * 0.55, 8).fill({ color: 0x000000, alpha: 0.18 });
  }

  function drawMatrixRain(g: Graphics, c: C) {
    const advance = matrixTick % 3 === 0;
    for (const col of matrixCols) {
      if (advance) col.y += col.speed * CELL;
      if (col.y - col.len * CELL > SC_Y + SC_H) {
        col.y     = SC_Y - CELL * (1 + Math.random() * 5);
        col.speed = 0.4 + Math.random() * 1.2;
        col.len   = 4 + Math.floor(Math.random() * 10);
      }
      for (let j = 0; j < col.len; j++) {
        const gy = col.y - j * CELL;
        if (gy < SC_Y || gy >= SC_Y + SC_H) continue;
        const t = j / col.len;
        const color = j === 0 ? c.matrixBright : c.matrixCol;
        const alpha = j === 0 ? 0.95 : (1 - t) * 0.65;
        g.rect(col.x + 1, gy + 1, CELL - 2, CELL - 2).fill({ color, alpha });
      }
    }
  }

  function drawHoverGlow(g: Graphics) {
    if (!hoverZone) return;
    const zones: Record<string, [number, number, number, number]> = {
      menu:     [SC_X - 2, SC_Y - 2,   SC_W + 4,  SC_H + 4],
      cv:       [PL_X - 2, PL_Y - 2,   PL_W + 4,  PL_H + 4],
      corkboard:[CK_X - 2, CK_Y - 2,   CK_W + 4,  CK_H + 4],
      hobbies:  [SH_X - 2, SH_Y - SH_H - 10, SH_W + 4, SH_H + 60],
    };
    const z = zones[hoverZone];
    if (!z) return;
    const [zx, zy, zw, zh] = z;
    g.rect(zx, zy, zw, zh).stroke({ color: 0x40cc40, width: 2.5, alpha: 0.8 });
  }

  function drawScene(g: Graphics, th: string, dk: boolean) {
    const c = getColors(th);
    drawRoom(g, c);
    drawFloor(g, c);
    drawWindow(g, c, dk);
    drawNameplate(g, c);
    drawClock(g, c);
    drawShelf(g, c);
    drawCorkboard(g, c);
    drawDesk(g, c);
    drawPapers(g, c);
    drawMonitorBody(g, c);
    drawKeyboard(g, c);
    drawMouse(g, c);
    drawMug(g, c);
    drawLamp(g, c);
    drawMatrixRain(g, c);
    drawChair(g, c);
    drawTrashCan(g, c);
    drawHoverGlow(g);
  }

  // ── Text labels (added once to stage) ────────────────────────────────────
  function addTextLabels() {
    const p = config?.person ?? {};
    const nameStyle = new TextStyle({ fontFamily: 'Special Elite, cursive, serif', fontSize: 20, fill: '#2a1808', align: 'center', fontWeight: 'bold' });
    const subtitleStyle = new TextStyle({ fontFamily: 'Special Elite, cursive, serif', fontSize: 13, fill: '#4a3018', align: 'center' });
    const tagStyle      = new TextStyle({ fontFamily: 'Special Elite, cursive, serif', fontSize: 11, fill: '#5a3820', align: 'center', fontStyle: 'italic' });

    if (p.name) {
      const t = new Text({ text: p.name ?? '', style: nameStyle });
      t.anchor.set(0.5, 0);
      t.position.set(PL_X + PL_W / 2, PL_Y + 44);
      app.stage.addChild(t);
    }
    if (p.title) {
      const t = new Text({ text: p.title ?? '', style: subtitleStyle });
      t.anchor.set(0.5, 0);
      t.position.set(PL_X + PL_W / 2, PL_Y + 74);
      app.stage.addChild(t);
    }
    if (p.tagline) {
      const words = (p.tagline as string).split(' ');
      const mid = Math.ceil(words.length / 2);
      const line1 = words.slice(0, mid).join(' ');
      const line2 = words.slice(mid).join(' ');
      for (const [i, line] of [[0, line1], [1, line2]] as [number, string][]) {
        const t = new Text({ text: line, style: tagStyle });
        t.anchor.set(0.5, 0);
        t.position.set(PL_X + PL_W / 2, PL_Y + 102 + i * 16);
        app.stage.addChild(t);
      }
    }
  }

  // ── Interactive hit zones ─────────────────────────────────────────────────
  function setupInteractiveZones() {
    const zoneDefs: Array<{ name: string; x: number; y: number; w: number; h: number; popup: 'menu' | 'cv' | 'hobbies' | 'pinboard' }> = [
      { name: 'menu',      x: SC_X - 14, y: SC_Y - 14, w: SC_W + 28, h: SC_H + 28, popup: 'menu'     },
      { name: 'cv',        x: PL_X,      y: PL_Y,      w: PL_W,      h: PL_H,      popup: 'cv'       },
      { name: 'corkboard', x: CK_X - 4,  y: CK_Y - 4,  w: CK_W + 8,  h: CK_H + 8,  popup: 'pinboard' },
      { name: 'hobbies',   x: SH_X - 4,  y: SH_Y - 56, w: SH_W + 8,  h: 80,         popup: 'hobbies'  },
    ];

    for (const z of zoneDefs) {
      const zone = new Graphics();
      zone.rect(z.x, z.y, z.w, z.h).fill({ color: 0xffffff, alpha: 0.01 });
      zone.eventMode = 'static';
      zone.cursor = 'pointer';
      zone.on('pointerdown', () => openPopup(z.popup));
      zone.on('pointerover', () => { hoverZone = z.name; });
      zone.on('pointerout',  () => { hoverZone = null; });
      app.stage.addChild(zone);
    }
  }

  // ── Mount ─────────────────────────────────────────────────────────────────
  onMount(async () => {
    try { config = JSON.parse(configJson); } catch {}

    // Pre-compute star positions
    for (let i = 0; i < 22; i++) {
      starPos.push([
        GLS_X + 5 + Math.random() * (GLS_W - 10),
        GLS_Y + 5 + Math.random() * (GLS_H * 0.55),
        0.8 + Math.random() * 1.6,
      ]);
    }

    // Pre-compute cork notes
    const nw = [64, 56, 72, 60], nh = [50, 44, 56, 48];
    const offsets = [[8, 10], [82, 18], [8, 80], [82, 88], [8, 152], [82, 160], [8, 224], [82, 232]];
    for (let i = 0; i < 8; i++) {
      const [ox, oy] = offsets[i];
      corkNotes.push({ x: CK_X + ox, y: CK_Y + oy, w: nw[i % 4], h: nh[i % 4], ci: i });
    }

    // Init matrix rain columns
    const colCount = Math.floor(SC_W / CELL);
    for (let i = 0; i < colCount; i++) {
      matrixCols.push({
        x: SC_X + i * CELL,
        y: SC_Y - Math.random() * SC_H,
        speed: 0.4 + Math.random() * 1.2,
        len: 4 + Math.floor(Math.random() * 10),
      });
    }

    app = new Application();
    await app.init({
      resizeTo: containerEl,
      backgroundAlpha: 0,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });
    Object.assign(app.canvas.style, { position: 'absolute', inset: '0', display: 'block' });
    containerEl.insertBefore(app.canvas, containerEl.firstChild);

    function scaleToFit() {
      const W = app.screen.width, H = app.screen.height;
      const s = Math.min(W / SW, H / SH);
      app.stage.scale.set(s);
      app.stage.position.set((W - SW * s) / 2, (H - SH * s) / 2);
    }

    scaleToFit();
    ro = new ResizeObserver(scaleToFit);
    ro.observe(containerEl);

    const gfx = new Graphics();
    app.stage.addChildAt(gfx, 0);

    addTextLabels();
    setupInteractiveZones();

    app.ticker.add(() => {
      matrixTick++;
      gfx.clear();
      drawScene(gfx, $theme, $darkMode);
    });
  });

  onDestroy(() => {
    ro?.disconnect();
    app?.destroy(true);
  });
</script>

<!-- Container: Pixi canvas + HTML overlays -->
<div bind:this={containerEl} class="wrap">

  <!-- Back to home button -->
  <a href={landingUrl} class="home-btn" aria-label="Back to home">← HOME</a>

  <!-- Popup layer (rendered as HTML over canvas) -->
  {#if $activePopup !== 'none'}
    <div class="popup-backdrop" on:click={closePopup} on:keydown={(e) => e.key === 'Escape' && closePopup()} role="presentation" tabindex="-1"></div>
  {/if}

  {#if $activePopup === 'menu'}
    <MainMenuPopup {config} />
  {/if}
  {#if $activePopup === 'cv'}
    <CVPopup {config} />
  {/if}
  {#if $activePopup === 'hobbies'}
    <HobbiesPopup {config} />
  {/if}
  {#if $activePopup === 'pinboard'}
    <PinboardPopup {config} />
  {/if}

</div>

<style>
  .wrap {
    position: absolute;
    inset: 0;
    overflow: hidden;
  }

  .home-btn {
    position: absolute;
    top: 10px;
    left: 14px;
    z-index: 50;
    font-family: 'VT323', monospace;
    font-size: 16px;
    color: rgba(200, 160, 80, 0.6);
    text-decoration: none;
    letter-spacing: 1px;
    padding: 2px 8px;
    border: 1px solid rgba(200, 160, 80, 0.25);
    background: rgba(0, 0, 0, 0.3);
    transition: color 0.2s, border-color 0.2s;
    pointer-events: all;
  }
  .home-btn:hover {
    color: rgba(232, 160, 64, 1);
    border-color: rgba(232, 160, 64, 0.6);
    text-decoration: none;
  }

  .popup-backdrop {
    position: absolute;
    inset: 0;
    z-index: 150;
    background: rgba(0, 0, 0, 0.45);
    cursor: default;
  }
</style>
