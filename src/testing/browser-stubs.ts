/**
 * Stubs for browser APIs jsdom does not implement (or implements with real
 * timing). Each installer returns a handle the spec uses to drive the stub and
 * must be undone with the returned `restore()` in an afterEach.
 */

export interface StubbedIntersectionObserver {
  readonly observed: Element[];
  disconnected: boolean;
  /** Fires the observer callback as if its target entered/left the viewport. */
  trigger(isIntersecting: boolean): void;
}

export interface IntersectionObserverStub {
  readonly instances: StubbedIntersectionObserver[];
  /** Fires every observer created so far. */
  triggerAll(isIntersecting: boolean): void;
  restore(): void;
}

/** jsdom has no IntersectionObserver; components that reveal on scroll need one. */
export function stubIntersectionObserver(): IntersectionObserverStub {
  const instances: StubbedIntersectionObserver[] = [];
  const original = (globalThis as Record<string, unknown>)['IntersectionObserver'];

  class FakeIntersectionObserver implements StubbedIntersectionObserver {
    readonly observed: Element[] = [];
    disconnected = false;

    constructor(private readonly callback: IntersectionObserverCallback) {
      instances.push(this);
    }

    observe(target: Element): void {
      this.observed.push(target);
    }

    disconnect(): void {
      this.disconnected = true;
    }

    trigger(isIntersecting: boolean): void {
      const entries = this.observed.map(
        target => ({ isIntersecting, target }) as unknown as IntersectionObserverEntry,
      );
      this.callback(entries, this as unknown as IntersectionObserver);
    }
  }

  (globalThis as Record<string, unknown>)['IntersectionObserver'] = FakeIntersectionObserver;

  return {
    instances,
    triggerAll: (isIntersecting: boolean) => instances.forEach(o => o.trigger(isIntersecting)),
    restore: () => {
      (globalThis as Record<string, unknown>)['IntersectionObserver'] = original;
    },
  };
}

export interface AnimationFrameStub {
  /** Runs every queued frame callback with `timestamp`, repeatedly, until the queue drains. */
  flush(timestamp: number): void;
  restore(): void;
}

/**
 * Makes requestAnimationFrame synchronous so counter/bar animations can be run
 * to completion inside a test instead of waiting ~1.6 seconds of real time.
 */
export function stubAnimationFrame(): AnimationFrameStub {
  const queue: FrameRequestCallback[] = [];
  const original = globalThis.requestAnimationFrame;

  globalThis.requestAnimationFrame = (cb: FrameRequestCallback) => {
    queue.push(cb);
    return queue.length;
  };

  return {
    flush(timestamp: number) {
      // Each callback may queue the next frame; keep draining, but never loop
      // forever if a component schedules unconditionally.
      for (let guard = 0; guard < 100 && queue.length > 0; guard++) {
        const pending = queue.splice(0, queue.length);
        pending.forEach(cb => cb(timestamp));
      }
    },
    restore: () => {
      globalThis.requestAnimationFrame = original;
    },
  };
}
