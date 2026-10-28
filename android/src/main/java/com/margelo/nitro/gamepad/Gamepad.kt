package com.margelo.nitro.gamepad

import com.facebook.proguard.annotations.DoNotStrip

@DoNotStrip
class Gamepad : HybridGamepadSpec() {
  override fun multiply(a: Double, b: Double): Double {
    return a * b
  }
}
