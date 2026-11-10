import { AsciiRenderer, type OceanTheme, type RenderOptions } from "./renderer";
import { World, type SharkSpec } from "./world";

const STEP = 1 / 60;
const MAX_STEPS = 4;

export interface OceanOptions extends RenderOptions {
  /** Who swims, and how big (size is relative to the biggest). Sharks, an orca, a manta ray, a whale shark. */
  creatures?: SharkSpec[];
  /** Overrides the area-based fish population. */
  fishCount?: number;
  /** Cap on drawn frames per second. The simulation keeps its own fixed step. Default: every frame. */
  fps?: number;
  /** Cap on device pixel ratio. Default 2. */
  maxDpr?: number;
  /** Fish flee the pointer and a click makes a splash. Default true. */
  interactive?: boolean;
  /** Start paused; call resume() to begin. */
  paused?: boolean;
}

/**
 * Wires World + AsciiRenderer to a canvas: fixed-timestep loop, resize,
 * pointer input, pausing off-screen, and prefers-reduced-motion.
 */
export class OceanEngine {
  private world: World;
  private renderer: AsciiRenderer;
  private raf = 0;
  private last = 0;
  private acc = 0;
  private visible = true;
  private reducedMotion: MediaQueryList;
  private resizeObserver: ResizeObserver;
  private intersectionObserver: IntersectionObserver;
  private disposed = false;
  private paused = false;
  private options: OceanOptions;
  private lastDraw = 0;

  /** Pass a roster (as before) or an options object. */
  constructor(private canvas: HTMLCanvasElement, sharksOrOptions?: SharkSpec[] | OceanOptions) {
    const options: OceanOptions = Array.isArray(sharksOrOptions) ? { creatures: sharksOrOptions } : sharksOrOptions ?? {};
    this.options = options;
    this.paused = !!options.paused;
    this.world = new World(options.creatures, options.fishCount);
    this.renderer = new AsciiRenderer(canvas, options);
    this.renderer.setFontFamily(getComputedStyle(canvas).fontFamily);
    this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
    this.intersectionObserver = new IntersectionObserver(([entry]) => {
      this.visible = entry.isIntersecting;
      this.schedule();
    });
    this.intersectionObserver.observe(canvas);

    this.reducedMotion.addEventListener("change", this.onMotionPreference);
    if (options.interactive !== false) {
      window.addEventListener("pointermove", this.onPointerMove, { passive: true });
      window.addEventListener("pointerdown", this.onPointerDown, { passive: true });
      document.documentElement.addEventListener("pointerleave", this.onPointerLeave);
      window.addEventListener("blur", this.onPointerLeave);
    }
    document.addEventListener("visibilitychange", this.onVisibility);

    this.resize();
    // Canvas text can't trigger a webfont load; once the mono face is in, redraw.
    document.fonts?.load(`600 16px ${getComputedStyle(canvas).fontFamily}`).then(() => {
      if (!this.disposed && this.reducedMotion.matches) this.drawStill();
    });
    this.schedule();
  }

  /** Stop simulating and drawing; the last frame stays on the canvas. */
  pause() {
    this.paused = true;
    cancelAnimationFrame(this.raf);
  }

  resume() {
    this.paused = false;
    this.schedule();
  }

  get running() {
    return !this.paused;
  }

  /** Swap colours live, for example when the page changes between light and dark. */
  setTheme(theme: OceanTheme) {
    this.renderer.setTheme(theme);
    if (this.paused || this.reducedMotion.matches) this.renderer.render(this.world, STEP);
  }

  destroy() {
    this.disposed = true;
    document.removeEventListener("visibilitychange", this.onVisibility);
    cancelAnimationFrame(this.raf);
    this.resizeObserver.disconnect();
    this.intersectionObserver.disconnect();
    this.reducedMotion.removeEventListener("change", this.onMotionPreference);
    window.removeEventListener("pointermove", this.onPointerMove);
    window.removeEventListener("pointerdown", this.onPointerDown);
    document.documentElement.removeEventListener("pointerleave", this.onPointerLeave);
    window.removeEventListener("blur", this.onPointerLeave);
  }

  private resize() {
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return;
    const dpr = Math.min(window.devicePixelRatio || 1, this.options.maxDpr ?? 2);
    this.renderer.resize(rect.width, rect.height, dpr);
    this.world.resize(rect.width, rect.height, this.renderer.cellWidth, this.renderer.cellHeight);
    if (this.reducedMotion.matches) this.drawStill();
  }

  private schedule() {
    cancelAnimationFrame(this.raf);
    if (this.disposed || this.paused || !this.visible || document.hidden || this.reducedMotion.matches) return;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.frame);
  }

  private frame = (now: number) => {
    const dt = Math.min(0.1, (now - this.last) / 1000);
    this.last = now;
    this.acc += dt;
    let steps = 0;
    while (this.acc >= STEP && steps < MAX_STEPS) {
      this.world.step(STEP);
      this.acc -= STEP;
      steps++;
    }
    if (steps === MAX_STEPS) this.acc = 0;
    const gap = this.options.fps ? 1000 / this.options.fps - 2 : 0;
    if (now - this.lastDraw >= gap) {
      this.renderer.render(this.world, Math.min(0.1, (now - this.lastDraw) / 1000));
      this.lastDraw = now;
    }
    this.raf = requestAnimationFrame(this.frame);
  };

  /** Reduced motion: let the ecosystem settle, then show a single frame. */
  private drawStill() {
    if (this.world.time < 4) {
      for (let i = 0; i < 240; i++) this.world.step(STEP);
    }
    this.renderer.render(this.world, STEP);
  }

  private onVisibility = () => this.schedule();

  private onMotionPreference = () => {
    if (this.reducedMotion.matches) {
      cancelAnimationFrame(this.raf);
      this.drawStill();
    } else {
      this.schedule();
    }
  };

  private toLocal(e: PointerEvent) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const inside = x >= 0 && y >= 0 && x <= rect.width && y <= rect.height;
    return { x, y, inside };
  }

  private onPointerMove = (e: PointerEvent) => {
    const { x, y, inside } = this.toLocal(e);
    const p = this.world.pointer;
    p.x = x;
    p.y = y;
    p.active = inside && e.pointerType !== "touch";
  };

  private onPointerDown = (e: PointerEvent) => {
    const { x, y, inside } = this.toLocal(e);
    if (inside && !this.reducedMotion.matches) this.world.splash(x, y);
  };

  private onPointerLeave = () => {
    this.world.pointer.active = false;
  };
}
