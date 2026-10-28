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

  fun onKeyEvent(event: KeyEvent) {
    val listener = keyListener ?: return
    if (!event.isGamepadKey()) return

    listener(event.toNativeGamepadKeyEvent())
  }

  fun onMotionEvent(event: MotionEvent) {
    val listener = axesListener ?: return
    if (!event.isGamepadAxesMove()) return

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
  }
}
