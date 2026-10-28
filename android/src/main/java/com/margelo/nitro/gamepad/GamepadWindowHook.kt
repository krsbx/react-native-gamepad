package com.margelo.nitro.gamepad

import android.app.Activity
import android.app.Application
import android.os.Build
import android.os.Bundle
import android.view.KeyEvent
import android.view.KeyboardShortcutGroup
import android.view.Menu
import android.view.MotionEvent
import android.view.Window
import androidx.annotation.RequiresApi
import com.margelo.nitro.NitroModules

/**
 * Captures gamepad input without the host app touching MainActivity: every
 * resumed activity's Window.Callback gets wrapped so key/motion events from
 * gamepads are reported to [GamepadInput]. Events are observed, never
 * consumed: Android still needs them for focus navigation, stick-to-D-pad
 * synthesis and the A/B -> confirm/back fallbacks.
 */
internal object GamepadWindowHook : Application.ActivityLifecycleCallbacks {
  private var installed = false

  @Synchronized
  fun install() {
    if (installed) return
    val context = NitroModules.applicationContext ?: return
    val application = context.applicationContext as? Application ?: return

    application.registerActivityLifecycleCallbacks(this)
    // The current activity resumed before we registered, so wrap it now.
    context.currentActivity?.let { activity -> activity.runOnUiThread { wrap(activity) } }
    installed = true
  }

  private fun wrap(activity: Activity) {
    val window = activity.window ?: return
    val callback = window.callback ?: return
    if (callback !is GamepadWindowCallback) {
      window.callback = GamepadWindowCallback(callback)
    }
  }

  override fun onActivityResumed(activity: Activity) = wrap(activity)
  override fun onActivityCreated(activity: Activity, savedInstanceState: Bundle?) {}
  override fun onActivityStarted(activity: Activity) {}
  override fun onActivityPaused(activity: Activity) {}
  override fun onActivityStopped(activity: Activity) {}
  override fun onActivitySaveInstanceState(activity: Activity, outState: Bundle) {}
  override fun onActivityDestroyed(activity: Activity) {}
}

private class GamepadWindowCallback(
  private val delegate: Window.Callback,
) : Window.Callback by delegate {
  override fun dispatchKeyEvent(event: KeyEvent): Boolean {
    GamepadInput.onKeyEvent(event)
    return delegate.dispatchKeyEvent(event)
  }

  override fun dispatchGenericMotionEvent(event: MotionEvent): Boolean {
    GamepadInput.onMotionEvent(event)
    return delegate.dispatchGenericMotionEvent(event)
  }

  // Java default methods: forward explicitly so wrapping doesn't swallow them.
  override fun onProvideKeyboardShortcuts(data: MutableList<KeyboardShortcutGroup>?, menu: Menu?, deviceId: Int) =
    delegate.onProvideKeyboardShortcuts(data, menu, deviceId)

  @RequiresApi(Build.VERSION_CODES.O)
  override fun onPointerCaptureChanged(hasCapture: Boolean) =
    delegate.onPointerCaptureChanged(hasCapture)
}
