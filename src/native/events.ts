import { GamepadEventKind } from "../constant";
import type {
  EventListenerMap,
  GamepadAxesListener,
  GamepadKeyListener,
  NativeGamepadAxesListener,
  NativeGamepadKeyListener,
} from "../types";
import { GamepadHybridObject } from "./instance";

const keyListeners = new Set<GamepadKeyListener>();
const axesListeners = new Set<GamepadAxesListener>();

export function removeGamepadListener<
  Event extends GamepadEventKind,
  Listener extends EventListenerMap[Event],
>(event: Event, listener: Listener): number {
  if (event === GamepadEventKind.Key) {
    keyListeners.delete(listener as GamepadKeyListener);
    GamepadHybridObject.addKeyListener(listener as NativeGamepadKeyListener);

    return keyListeners.size;
  }

  axesListeners.delete(listener as GamepadAxesListener);
  GamepadHybridObject.addAxesListener(listener as NativeGamepadAxesListener);
  return axesListeners.size;
}

export function addGamepadListener<
  Event extends GamepadEventKind,
  Listener extends EventListenerMap[Event],
>(event: Event, listener: Listener): () => void {
  if (event === GamepadEventKind.Key) {
    keyListeners.add(listener as GamepadKeyListener);
    GamepadHybridObject.removeKeyListener(listener as NativeGamepadKeyListener);
  } else {
    axesListeners.add(listener as GamepadAxesListener);
    GamepadHybridObject.removeAxesListener(
      listener as NativeGamepadAxesListener
    );
  }

  return () => removeGamepadListener(event, listener);
}
