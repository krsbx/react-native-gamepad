package com.margelo.nitro.gamepad

import android.view.InputDevice
import android.view.KeyEvent

/**
 * A button or D-pad key coming from a gamepad, not a keyboard. Fallback events
 * (D-pad keys Android synthesizes from stick movement, DPAD_CENTER/BACK from an
 * unhandled A/B) are skipped: JS already got the original stick/button event.
 */
internal fun KeyEvent.isGamepadKey(): Boolean {
  if ((flags and KeyEvent.FLAG_FALLBACK) != 0) return false

  val fromGamepad =
    isFromSource(InputDevice.SOURCE_GAMEPAD) ||
      isFromSource(InputDevice.SOURCE_JOYSTICK) ||
      isFromSource(InputDevice.SOURCE_DPAD)

  return fromGamepad && isGamepadKeyCode(keyCode)
}

internal fun KeyEvent.toNativeGamepadKeyEvent(): NativeGamepadKeyEvent =
  NativeGamepadKeyEvent(
    kind = "key",
    name = keyName(keyCode),
    action = keyAction(action),
    keyCode = keyCode.toDouble(),
    repeatCount = repeatCount.toDouble(),
    deviceId = deviceId.toDouble(),
    deviceName = device?.name ?: "unknown",
  )

@Suppress("DEPRECATION")
private fun keyAction(action: Int): GamepadKeyAction = when (action) {
  KeyEvent.ACTION_DOWN -> GamepadKeyAction.DOWN
  KeyEvent.ACTION_UP -> GamepadKeyAction.UP
  KeyEvent.ACTION_MULTIPLE -> GamepadKeyAction.MULTIPLE
  else -> GamepadKeyAction.UNKNOWN
}

private fun isGamepadKeyCode(keyCode: Int): Boolean =
  KeyEvent.isGamepadButton(keyCode) || when (keyCode) {
    KeyEvent.KEYCODE_DPAD_UP,
    KeyEvent.KEYCODE_DPAD_DOWN,
    KeyEvent.KEYCODE_DPAD_LEFT,
    KeyEvent.KEYCODE_DPAD_RIGHT,
    KeyEvent.KEYCODE_DPAD_CENTER,
    KeyEvent.KEYCODE_ENTER,
    -> true

    else -> false
  }

private fun keyName(keyCode: Int): String = when (keyCode) {
  KeyEvent.KEYCODE_BUTTON_A -> "a"
  KeyEvent.KEYCODE_BUTTON_B -> "b"
  KeyEvent.KEYCODE_BUTTON_X -> "x"
  KeyEvent.KEYCODE_BUTTON_Y -> "y"
  KeyEvent.KEYCODE_BUTTON_L1 -> "l1"
  KeyEvent.KEYCODE_BUTTON_R1 -> "r1"
  KeyEvent.KEYCODE_BUTTON_L2 -> "l2"
  KeyEvent.KEYCODE_BUTTON_R2 -> "r2"
  KeyEvent.KEYCODE_BUTTON_THUMBL -> "l3"
  KeyEvent.KEYCODE_BUTTON_THUMBR -> "r3"
  KeyEvent.KEYCODE_BUTTON_SELECT -> "select"
  KeyEvent.KEYCODE_BUTTON_START -> "start"
  KeyEvent.KEYCODE_BUTTON_MODE -> "mode"
  KeyEvent.KEYCODE_DPAD_UP -> "dpad_up"
  KeyEvent.KEYCODE_DPAD_DOWN -> "dpad_down"
  KeyEvent.KEYCODE_DPAD_LEFT -> "dpad_left"
  KeyEvent.KEYCODE_DPAD_RIGHT -> "dpad_right"
  KeyEvent.KEYCODE_DPAD_CENTER -> "dpad_center"
  KeyEvent.KEYCODE_ENTER -> "enter"
  else -> "key_$keyCode"
}
