package com.margelo.nitro.gamepad

import android.media.AudioAttributes
import android.os.Build
import android.os.VibrationAttributes
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.view.InputDevice
import com.facebook.proguard.annotations.DoNotStrip
import com.margelo.nitro.NitroModules
import com.margelo.nitro.core.Promise

@DoNotStrip
class Gamepad : HybridGamepadSpec() {
  override fun getConnectedGamepads(): Promise<Array<GamepadDevice>> = Promise.async {
    InputDevice.getDeviceIds()
      .asList()
      .mapNotNull { InputDevice.getDevice(it) }
      .filter { it.isGamepadLike() }
      .map {
        GamepadDevice(
          id = it.id.toDouble(),
          name = it.name,
          hasVibrator = it.hasUsableVibrator(),
          isVirtual = it.isVirtual,
        )
      }
      .toTypedArray()
  }

  override fun vibrate(deviceId: Double, durationMs: Double, strength: Double): Promise<Boolean> =
    Promise.async {
      val amplitude = strength.toInt()
      // VibrationEffect.createOneShot throws on these.
      if (durationMs <= 0 || (amplitude != VibrationEffect.DEFAULT_AMPLITUDE && amplitude !in 1..255)) {
        return@async false
      }

      val vibrator = vibratorFor(deviceId.toInt()) ?: return@async false
      vibrator.vibrateAsGameRumble(durationMs.toLong(), amplitude)
      true
    }

  override fun addKeyListener(listener: (event: NativeGamepadKeyEvent) -> Unit) {
    GamepadInput.keyListener = listener
  }

  override fun removeKeyListener(listener: (event: NativeGamepadKeyEvent) -> Unit) {
    // JS registers a single listener per kind, so there's only ever one to remove.
    GamepadInput.keyListener = null
  }

  override fun addAxesListener(listener: (event: NativeGamepadAxesEvent) -> Unit) {
    GamepadInput.axesListener = listener
  }

  override fun removeAxesListener(listener: (event: NativeGamepadAxesEvent) -> Unit) {
    GamepadInput.axesListener = null
  }

  /**
   * The device's own motor, else the system vibrator when the device is built
   * in (a handheld's controls report no vibrator, but the handheld rumbles) or
   * isn't an input device at all (e.g. -1). An external controller without a
   * motor gets nothing rather than buzzing the phone.
   */
  private fun vibratorFor(deviceId: Int): Vibrator? {
    val device = InputDevice.getDevice(deviceId) ?: return systemVibrator()
    device.usableVibrator()?.let { return it }

    val isExternal = Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q && device.isExternal
    return if (isExternal) null else systemVibrator()
  }

  private fun systemVibrator(): Vibrator? {
    val context = NitroModules.applicationContext ?: return null
    val vibrator =
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        context.getSystemService(VibratorManager::class.java)?.defaultVibrator
      } else {
        @Suppress("DEPRECATION")
        context.getSystemService(Vibrator::class.java)
      }
    return vibrator?.takeIf { it.hasVibrator() }
  }
}

internal fun InputDevice.isGamepadLike(): Boolean =
  supportsSource(InputDevice.SOURCE_GAMEPAD) ||
    supportsSource(InputDevice.SOURCE_JOYSTICK) ||
    supportsSource(InputDevice.SOURCE_DPAD)

/**
 * Vibrates with an explicit media/game usage. Without one, Android classifies
 * a short app vibration as touch feedback (USAGE_TOUCH) and drops it whenever
 * the user has "touch feedback" turned off — common on handhelds.
 */
private fun Vibrator.vibrateAsGameRumble(durationMs: Long, amplitude: Int) {
  when {
    Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU ->
      vibrate(
        VibrationEffect.createOneShot(durationMs, amplitude),
        VibrationAttributes.createForUsage(VibrationAttributes.USAGE_MEDIA),
      )

    Build.VERSION.SDK_INT >= Build.VERSION_CODES.O ->
      @Suppress("DEPRECATION")
      vibrate(
        VibrationEffect.createOneShot(durationMs, amplitude),
        AudioAttributes.Builder()
          .setUsage(AudioAttributes.USAGE_GAME)
          .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
          .build(),
      )

    // API 24-25: no VibrationEffect, so no amplitude control.
    else ->
      @Suppress("DEPRECATION")
      vibrate(
        durationMs,
        AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_GAME).build(),
      )
  }
}

@Suppress("DEPRECATION")
private fun InputDevice.usableVibrator(): Vibrator? =
  vibrator.takeIf { it.hasVibrator() }

private fun InputDevice.hasUsableVibrator(): Boolean = usableVibrator() != null
