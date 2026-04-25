package dev.llmmarkdown.selectabletext

import android.content.Context
import android.view.ActionMode
import android.view.Menu
import android.view.MenuItem
import android.view.View
import android.widget.TextView
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactContext
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.facebook.react.views.view.ReactViewGroup

// Extends ReactViewGroup instead of FrameLayout so the Fabric shadow tree
// drives child layout. FrameLayout.onLayout re-positions children based on
// its own `gravity`/layoutParams logic, which collapses children to 0x0
// when the LLMSelectableTextView is nested inside a flex row (blockquote)
// or a horizontal ScrollView (code block) — making the wrapped text
// invisible even though the container paints. ReactViewGroup's onLayout
// is a deliberate no-op, leaving positions exactly where Fabric set them.
class LLMSelectableTextView(context: Context) : ReactViewGroup(context) {
  private var menuOptions: Array<String> = emptyArray()
  private var textView: TextView? = null

  fun setMenuOptions(options: Array<String>) {
    this.menuOptions = options
    textView?.let { setupSelectionCallback(it) }
  }

  override fun onViewAdded(child: View) {
    super.onViewAdded(child)
    // Pick up the first TextView child as soon as Fabric mounts it — don't
    // rely on onLayout (ReactViewGroup's is a no-op) to discover children.
    if (textView == null && child is TextView) {
      textView = child
      setupSelectionCallback(child)
    }
  }

  override fun onViewRemoved(child: View) {
    super.onViewRemoved(child)
    if (child === textView) {
      textView = null
    }
  }

  private fun setupSelectionCallback(textView: TextView) {
    textView.setTextIsSelectable(true)
    textView.customSelectionActionModeCallback = object : ActionMode.Callback {
      override fun onCreateActionMode(mode: ActionMode?, menu: Menu?): Boolean = true

      override fun onPrepareActionMode(mode: ActionMode?, menu: Menu?): Boolean {
        menu?.clear()
        menuOptions.forEachIndexed { index, option ->
          menu?.add(0, index, 0, option)
        }
        return true
      }

      override fun onActionItemClicked(mode: ActionMode?, item: MenuItem?): Boolean {
        val start = textView.selectionStart
        val end = textView.selectionEnd
        val selectedText = textView.text.toString().substring(start, end)
        val chosenOption = menuOptions[item?.itemId ?: 0]
        emitSelection(chosenOption, selectedText)
        mode?.finish()
        return true
      }

      override fun onDestroyActionMode(mode: ActionMode?) {}
    }
  }

  private fun emitSelection(chosenOption: String, highlightedText: String) {
    val reactContext = context as ReactContext
    val params = Arguments.createMap().apply {
      putInt("viewTag", id)
      putString("chosenOption", chosenOption)
      putString("highlightedText", highlightedText)
    }
    reactContext
      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      .emit("LLMSelectableTextSelection", params)
  }
}
