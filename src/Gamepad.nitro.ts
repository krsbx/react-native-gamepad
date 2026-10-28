import type { HybridObject } from "react-native-nitro-modules";
import type {
  GamepadDevice,
  NativeGamepadAxesListener,
  NativeGamepadKeyListener,
} from "./types";

export interface Gamepad extends HybridObject<{
  ios: "swift";
  android: "kotlin";
}> {
  getConnectedGamepads(): Promise<GamepadDevice[]>;
  vibrate(
    deviceId: number,
    durationMs: number,
    strength: number
  ): Promise<boolean>;

  addKeyListener(listener: NativeGamepadKeyListener): void;
  removeKeyListener(listener: NativeGamepadKeyListener): void;

  addAxesListener(listener: NativeGamepadAxesListener): void;
  removeAxesListener(listener: NativeGamepadAxesListener): void;
}
