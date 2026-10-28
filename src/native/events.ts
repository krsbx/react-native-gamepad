import { GamepadEventKind } from "../constant";
import type {
  EventListenerMap,
  GamepadAxesListener,
  GamepadButtonName,
  GamepadKeyListener,
  NativeGamepadAxesEvent,
  NativeGamepadKeyEvent,
} from "../types";
import { GamepadHybridObject } from "./instance";

const keyListeners = new Set<GamepadKeyListener>();
const axesListeners = new Set<GamepadAxesListener>();

/**
 * Native holds at most one listener per kind: these. A JS function gets a new
 * native wrapper every time it crosses the bridge, so native can't match a
 * listener on removal — fan-out to subscribers happens here instead.
 */
function onNativeKey(event: NativeGamepadKeyEvent) {
  const keyEvent = {
    ...event,
    kind: GamepadEventKind.Key,
    name: event.name as GamepadButtonName,
  };

  keyListeners.forEach((listener) => listener(keyEvent));
}

function onNativeAxes(event: NativeGamepadAxesEvent) {
  const axesEvent = { ...event, kind: GamepadEventKind.Axes };

  axesListeners.forEach((listener) => listener(axesEvent));
}

export function removeGamepadListener<
  Event extends GamepadEventKind,
  Listener extends EventListenerMap[Event],
>(event: Event, listener: Listener): number {
  if (event === GamepadEventKind.Key) {
    if (
      keyListeners.delete(listener as GamepadKeyListener) &&
      keyListeners.size === 0
    ) {
      GamepadHybridObject.removeKeyListener(onNativeKey);
    }

    return keyListeners.size;
  }

  if (
    axesListeners.delete(listener as GamepadAxesListener) &&
    axesListeners.size === 0
  ) {
    GamepadHybridObject.removeAxesListener(onNativeAxes);
  }

  return axesListeners.size;
}

export function addGamepadListener<
  Event extends GamepadEventKind,
  Listener extends EventListenerMap[Event],
>(event: Event, listener: Listener): () => void {
  if (event === GamepadEventKind.Key) {
    if (keyListeners.size === 0) {
      GamepadHybridObject.addKeyListener(onNativeKey);
    }

    keyListeners.add(listener as GamepadKeyListener);
  } else {
    if (axesListeners.size === 0) {
      GamepadHybridObject.addAxesListener(onNativeAxes);
    }

    axesListeners.add(listener as GamepadAxesListener);
  }

  return () => removeGamepadListener(event, listener);
}
