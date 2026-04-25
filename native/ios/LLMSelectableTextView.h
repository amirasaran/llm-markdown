#import <React/RCTViewComponentView.h>
#import <UIKit/UIKit.h>

#ifndef LLMSelectableTextViewNativeComponent_h
#define LLMSelectableTextViewNativeComponent_h

NS_ASSUME_NONNULL_BEGIN

@interface LLMSelectableTextView : RCTViewComponentView <UITextViewDelegate>
@property (nonatomic, strong) UITextView *textView;
@property (nonatomic, strong) NSArray<NSString *> *menuOptions;
@end

NS_ASSUME_NONNULL_END

#endif /* LLMSelectableTextViewNativeComponent_h */
