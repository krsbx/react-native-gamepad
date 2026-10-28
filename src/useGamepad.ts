import { useCallback, useEffect, useRef, useState } from "react";
import { GamepadEventKind, GamepadKeyAction } from "./constant";
import type { VibrateGamepadOptions } from "./native";
import {
  addGamepadListener,
  getConnectedGamepads,
  vibrateGamepad,
} from "./native";
import type { GamepadAxes, GamepadEvent } from "./types";

/** No InputDevice has this id, so native goes straight to the system vibrator. */
const NO_INPUT_DEVICE = -1;

const EMPTY_AXES: GamepadAxes = {
  leftX: 0,
  leftY: 0,
  rightX: 0,
  rightY: 0,
  l2: 0,
  r2: 0,
  hatX: 0,
  hatY: 0,
};

export interface UseGamepadResult {
  /** button name -> held, updated on key down/up */
  pressed: Readonly<Record<string, boolean>>;
  /** latest normalized axis snapshot */
  axes: Readonly<GamepadAxes>;
  /** most recent raw event, for debugging/shortcuts */
  lastEvent: GamepadEvent | null;
  /**
   * Rumble a controller. Defaults to the one that sent the latest event,
   * else the first connected controller with a vibrator. Resolves false if
   * there is no such controller or the native module isn't linked.
   */
  vibrate: (options?: Partial<VibrateGamepadOptions>) => Promise<boolean>;
}

export function useGamepad(): UseGamepadResult {
  const [pressed, setPressed] = useState<Record<string, boolean>>({});
  const [axes, setAxes] = useState<GamepadAxes>(EMPTY_AXES);
  const [lastEvent, setLastEvent] = useState<GamepadEvent | null>(null);
  const lastDeviceId = useRef<number | null>(null);

  useEffect(() => {
    const unsubs = [
      addGamepadListener(GamepadEventKind.Key, (event) => {
        setLastEvent(event);
        lastDeviceId.current = event.deviceId;

        if (
          event.action === GamepadKeyAction.Down ||
          event.action === GamepadKeyAction.Up
        ) {
          const name = event.name;
          const isDown = event.action === GamepadKeyAction.Down;

          setPressed((prev) => {
            if (prev[name] === isDown) {
              return prev;
            }
            return { ...prev, [name]: isDown };
          });
        }
      }),
      addGamepadListener(GamepadEventKind.Axes, (event) => {
        setLastEvent(event);
        lastDeviceId.current = event.deviceId;
        setAxes(event.axes);
      }),
    ];

    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  }, []);

  const vibrate = useCallback(
    async (options?: Partial<VibrateGamepadOptions>): Promise<boolean> => {
      const target =
        options?.deviceId ??
        lastDeviceId.current ??
        (await getConnectedGamepads()).find((device) => device.hasVibrator)
          ?.id ??
        // No controller with its own motor: let native fall back to the
        // system vibrator (handhelds' built-in rumble).
        NO_INPUT_DEVICE;

      return vibrateGamepad({ ...options, deviceId: target });
    },
    []
  );

  return {
    pressed,
    axes,
    lastEvent,
    vibrate,
  };
}
