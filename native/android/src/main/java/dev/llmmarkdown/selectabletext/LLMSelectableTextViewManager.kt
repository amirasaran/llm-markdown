package dev.llmmarkdown.selectabletext

import com.facebook.react.bridge.ReadableArray
import com.facebook.react.common.MapBuilder
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.viewmanagers.LLMSelectableTextViewManagerDelegate
import com.facebook.react.viewmanagers.LLMSelectableTextViewManagerInterface

@ReactModule(name = LLMSelectableTextViewManager.NAME)
class LLMSelectableTextViewManager : ViewGroupManager<LLMSelectableTextView>(),
  LLMSelectableTextViewManagerInterface<LLMSelectableTextView> {

  private val mDelegate: ViewManagerDelegate<LLMSelectableTextView> =
    LLMSelectableTextViewManagerDelegate(this)

  override fun getDelegate(): ViewManagerDelegate<LLMSelectableTextView> = mDelegate

  override fun getName(): String = NAME

  public override fun createViewInstance(context: ThemedReactContext): LLMSelectableTextView =
    LLMSelectableTextView(context)

  @ReactProp(name = "menuOptions")
  override fun setMenuOptions(view: LLMSelectableTextView, menuOptions: ReadableArray?) {
    if (menuOptions != null) {
      val options = Array(menuOptions.size()) { i -> menuOptions.getString(i) ?: "" }
      view.setMenuOptions(options)
    }
  }

  override fun getExportedCustomDirectEventTypeConstants(): Map<String, Any> =
    MapBuilder.builder<String, Any>()
      .put("topSelection", MapBuilder.of("registrationName", "onSelection"))
      .build()

  companion object {
    const val NAME = "LLMSelectableTextView"
  }
}
