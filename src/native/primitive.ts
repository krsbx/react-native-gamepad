import type { GamepadDevice } from "../types";
import { GamepadHybridObject } from "./instance";

export async function getConnectedGamepads(): Promise<GamepadDevice[]> {
  return (await GamepadHybridObject?.getConnectedGamepads()) ?? [];
}

export interface VibrateGamepadOptions {
  deviceId: number;
  durationMs?: number;
  /**
   * Android-specific. See
   * @default -1 | DEFAULT_AMPLITUDE
   * @Range -1..255
   * https://developer.android.com/reference/android/os/VibrationEffect
   */
  strength?: number;
}

export function vibrateGamepad({
  deviceId,
  durationMs = 200,
  strength = -1,
}: VibrateGamepadOptions): Promise<boolean> {
  // Android's VibrationEffect.createOneShot throws on a non-positive duration.
  if (!(durationMs > 0)) {
    return Promise.resolve(false);
  }

  if (strength !== -1 && !(strength >= 1 && strength <= 255)) {
    return Promise.resolve(false);
  }

  return (
    GamepadHybridObject?.vibrate(deviceId, durationMs, strength) ??
    Promise.resolve(false)
  );
}
