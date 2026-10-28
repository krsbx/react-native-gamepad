import { NitroModules } from "react-native-nitro-modules";
import type { Gamepad } from "./Gamepad.nitro";

const GamepadHybridObject = NitroModules.createHybridObject<Gamepad>("Gamepad");

export function multiply(a: number, b: number): number {
  return GamepadHybridObject.multiply(a, b);
}
