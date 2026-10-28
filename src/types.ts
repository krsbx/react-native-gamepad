import type {
  GamepadButton,
  GamepadEventKind,
  GamepadKeyAction,
} from "./constant";

export type GamepadButtonName = GamepadButton | `key_${number}`;

export interface GamepadDevice {
  id: number;
  name: string;
  hasVibrator: boolean;
  isVirtual: boolean;
}

export interface GamepadKeyEvent {
  kind: typeof GamepadEventKind.Key;
  action: GamepadKeyAction;
  name: GamepadButtonName;
  keyCode: number;
  repeatCount: number;
  deviceId: number;
  deviceName: string;
}

export interface NativeGamepadKeyEvent extends Omit<
  GamepadKeyEvent,
  "kind" | "name"
> {
  kind: string;
  name: string;
}

export interface GamepadAxes {
  leftX: number;
  leftY: number;
  rightX: number;
  rightY: number;
  l2: number;
  r2: number;
  hatX: number;
  hatY: number;
}

export interface GamepadAxesEvent {
  kind: typeof GamepadEventKind.Axes;
  axes: GamepadAxes;
  deviceId: number;
  deviceName: string;
}

export interface NativeGamepadAxesEvent extends Omit<GamepadAxesEvent, "kind"> {
  kind: string;
}

export type GamepadEvent = GamepadKeyEvent | GamepadAxesEvent;

export type GamepadKeyListener = (event: GamepadKeyEvent) => void;

export type GamepadAxesListener = (event: GamepadAxesEvent) => void;

export type NativeGamepadKeyListener = (event: NativeGamepadKeyEvent) => void;

export type NativeGamepadAxesListener = (event: NativeGamepadAxesEvent) => void;

export type EventListenerMap = {
  [GamepadEventKind.Key]: GamepadKeyListener;
  [GamepadEventKind.Axes]: GamepadAxesListener;
};
