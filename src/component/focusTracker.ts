/**
 * How long a blur may go unanswered before the group counts native focus as
 * lost. A D-pad move delivers blur(old) and focus(new) back to back; touch
 * mode delivers a blur and nothing else until the next key press.
 */
export const FOCUS_LOST_DELAY_MS = 100;

export interface FocusTrackerOptions {
  /** Called whenever the highlighted (active) cell changes. */
  onActiveChange: (index: number | null) => void;
  schedule?: (fn: () => void, ms: number) => unknown;
  cancel?: (handle: unknown) => void;
}

export interface FocusTracker {
  /** The highlighted cell; survives Android touch mode dropping focus. */
  readonly active: number | null;
  /**
   * A cell received native focus. Returns the index focus should be sent to
   * instead, or null to accept it where it landed.
   */
  focus: (
    index: number,
    canRedirect: (target: number) => boolean
  ) => number | null;
  /** A cell lost native focus. */
  blur: () => void;
  /** Highlight a cell without native focus (e.g. it was tapped). */
  select: (index: number) => void;
  dispose: () => void;
}

/**
 * Keeps the highlighted cell in JS so touch doesn't erase it.
 *
 * On Android, a tap puts the window in touch mode, which strips native focus
 * from cells (they aren't focusable-in-touch-mode, and must not be, or the
 * first tap would only focus instead of press). The next D-pad press leaves
 * touch mode and focuses Android's default view — usually the first cell, not
 * the one the user had. The tracker remembers the active cell across that gap
 * and asks for focus to be redirected back to it.
 */
export function createFocusTracker({
  onActiveChange,
  schedule = setTimeout,
  cancel = (handle) => clearTimeout(handle as number),
}: FocusTrackerOptions): FocusTracker {
  let active: number | null = null;
  let lost = false;
  let pendingBlur: unknown = null;

  const setActive = (index: number) => {
    if (index !== active) {
      active = index;
      onActiveChange(index);
    }
  };

  const clearPendingBlur = () => {
    if (pendingBlur != null) {
      cancel(pendingBlur);
      pendingBlur = null;
    }
  };

  return {
    get active() {
      return active;
    },
    focus(index, canRedirect) {
      clearPendingBlur();
      const restoring = lost;
      lost = false;
      if (
        restoring &&
        active != null &&
        index !== active &&
        canRedirect(active)
      ) {
        return active;
      }
      setActive(index);
      return null;
    },
    blur() {
      clearPendingBlur();
      pendingBlur = schedule(() => {
        pendingBlur = null;
        lost = true;
      }, FOCUS_LOST_DELAY_MS);
    },
    select(index) {
      setActive(index);
    },
    dispose() {
      clearPendingBlur();
    },
  };
}
