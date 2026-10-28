package com.margelo.nitro.gamepad

import android.view.InputDevice
import android.view.MotionEvent
import kotlin.math.abs

/** Stick/trigger/hat movement from a gamepad. */
internal fun MotionEvent.isGamepadAxesMove(): Boolean =
  isFromSource(InputDevice.SOURCE_JOYSTICK) && action == MotionEvent.ACTION_MOVE

internal fun MotionEvent.toGamepadAxes(): GamepadAxes =
  GamepadAxes(
    leftX = centeredAxis(MotionEvent.AXIS_X),
    leftY = centeredAxis(MotionEvent.AXIS_Y),
    rightX = centeredAxis(MotionEvent.AXIS_Z),
    rightY = centeredAxis(MotionEvent.AXIS_RZ),
    // Controllers report triggers on either pair of axes.
    l2 = maxOf(getAxisValue(MotionEvent.AXIS_LTRIGGER), getAxisValue(MotionEvent.AXIS_BRAKE)).toDouble(),
    r2 = maxOf(getAxisValue(MotionEvent.AXIS_RTRIGGER), getAxisValue(MotionEvent.AXIS_GAS)).toDouble(),
    hatX = getAxisValue(MotionEvent.AXIS_HAT_X).toDouble(),
    hatY = getAxisValue(MotionEvent.AXIS_HAT_Y).toDouble(),
  )

/** Axis value with the device's dead zone ("flat") zeroed out. */
private fun MotionEvent.centeredAxis(axis: Int): Double {
  val range = device?.getMotionRange(axis, source) ?: return 0.0
  val value = getAxisValue(axis)
  return if (abs(value) > range.flat) value.toDouble() else 0.0
}
