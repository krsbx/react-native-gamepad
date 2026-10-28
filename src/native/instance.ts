import { NitroModules } from "react-native-nitro-modules";
import type { Gamepad } from "../Gamepad.nitro";

export const GamepadHybridObject =
  NitroModules.createHybridObject<Gamepad>("Gamepad");
