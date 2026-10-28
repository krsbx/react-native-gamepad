package com.margelo.nitro.gamepad

import android.view.KeyEvent
import android.view.MotionEvent

/**
 * Holds the JS listeners and turns gamepad key/motion events into Nitro
 * events. Events arrive via [GamepadWindowHook], installed on first listener.
 */
internal object GamepadInput {
  @Volatile
  var keyListener: ((NativeGamepadKeyEvent) -> Unit)? = null
    set(value) {
      field = value
      if (value != null) GamepadWindowHook.install()
    }

  @Volatile
  var axesListener: ((NativeGamepadAxesEvent) -> Unit)? = null
    set(value) {
      field = value
      if (value != null) GamepadWindowHook.install()
    }

  private val lastAxes = HashMap<Int, GamepadAxes>()

  /** Returns true when the event was delivered to JS and should be consumed. */
  fun onKeyEvent(event: KeyEvent): Boolean {
    val listener = keyListener ?: return false
    if (!event.isGamepadKey()) return false

    listener(event.toNativeGamepadKeyEvent())
    return true
  }

  /** Returns true when the event was delivered to JS and should be consumed. */
  fun onMotionEvent(event: MotionEvent): Boolean {
    val listener = axesListener ?: return false
    if (!event.isGamepadAxesMove()) return false

    val axes = event.toGamepadAxes()
    // Sticks resting inside the dead zone keep firing ACTION_MOVE; skip repeats.
    if (lastAxes.put(event.deviceId, axes) != axes) {
      listener(
        NativeGamepadAxesEvent(
          kind = "axes",
          deviceId = event.deviceId.toDouble(),
          deviceName = event.device?.name ?: "unknown",
          axes = axes,
        )
      )
    }
    return true
  }
}
