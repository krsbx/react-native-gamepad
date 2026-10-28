export const GamepadKeyAction = {
  Down: "down",
  Up: "up",
  Multiple: "multiple",
  Unknown: "unknown",
} as const;

export type GamepadKeyAction =
  (typeof GamepadKeyAction)[keyof typeof GamepadKeyAction];

export const GamepadEventKind = {
  Key: "key",
  Axes: "axes",
} as const;

export type GamepadEventKind =
  (typeof GamepadEventKind)[keyof typeof GamepadEventKind];

export const GamepadButton = {
  A: "a",
  B: "b",
  X: "x",
  Y: "y",
  L1: "l1",
  L2: "l2",
  L3: "l3",
  R1: "r1",
  R2: "r2",
  R3: "r3",
  Select: "select",
  Start: "start",
  Mode: "mode",
  DpadUp: "dpad_up",
  DpadDown: "dpad_down",
  DpadLeft: "dpad_left",
  DpadRight: "dpad_right",
  DpadCenter: "dpad_center",
  Enter: "enter",
} as const;

export type GamepadButton = (typeof GamepadButton)[keyof typeof GamepadButton];
