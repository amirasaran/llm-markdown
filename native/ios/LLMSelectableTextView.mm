#import "LLMSelectableTextView.h"

#import <react/renderer/components/LLMSelectableTextViewSpec/ComponentDescriptors.h>
#import <react/renderer/components/LLMSelectableTextViewSpec/EventEmitters.h>
#import <react/renderer/components/LLMSelectableTextViewSpec/Props.h>
#import <react/renderer/components/LLMSelectableTextViewSpec/RCTComponentViewHelpers.h>

#import "RCTFabricComponentsPlugins.h"

using namespace facebook::react;

@interface LLMSelectableTextView () <RCTLLMSelectableTextViewViewProtocol>
@end

@implementation LLMSelectableTextView {
    std::vector<std::string> _menuOptionsVector;
    BOOL _extractionScheduled;
    // Views we set hidden=YES on during text extraction. Tracked so we can
    // restore hidden=NO before Fabric returns them to its recycle pool (a
    // hidden view recycled into another component appears as missing text).
    NSHashTable<UIView *> *_hiddenSubviews;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
    return concreteComponentDescriptorProvider<LLMSelectableTextViewComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const LLMSelectableTextViewProps>();
    _props = defaultProps;

    _textView = [[UITextView alloc] init];
    _textView.delegate = self;
    _textView.editable = NO;
    _textView.selectable = YES;
    _textView.scrollEnabled = NO;
    _textView.backgroundColor = [UIColor clearColor];
    _textView.textContainerInset = UIEdgeInsetsZero;
    _textView.textContainer.lineFragmentPadding = 0;
    _textView.userInteractionEnabled = YES;
    _textView.allowsEditingTextAttributes = NO;
    _textView.dataDetectorTypes = UIDataDetectorTypeNone;
    _textView.text = @"";
    _menuOptions = @[];
    _hiddenSubviews = [NSHashTable weakObjectsHashTable];

    self.contentView = _textView;
    self.userInteractionEnabled = YES;
  }
  return self;
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
    const auto &oldViewProps = *std::static_pointer_cast<LLMSelectableTextViewProps const>(_props);
    const auto &newViewProps = *std::static_pointer_cast<LLMSelectableTextViewProps const>(props);

    if (oldViewProps.menuOptions != newViewProps.menuOptions) {
        _menuOptionsVector = newViewProps.menuOptions;
        NSMutableArray<NSString *> *options = [[NSMutableArray alloc] init];
        for (const auto& option : _menuOptionsVector) {
            [options addObject:[NSString stringWithUTF8String:option.c_str()]];
        }
        _menuOptions = options;
    }

    [super updateProps:props oldProps:oldProps];
}

- (void)mountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index
{
    [super mountChildComponentView:childComponentView index:index];
    [self setNeedsTextExtraction];
}

- (void)unmountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index
{
    // Restore hidden=NO on anything we hid inside this subtree *before* Fabric
    // can recycle those views into other components. Skipping this lets a
    // hidden UILabel/paragraph view resurface elsewhere as invisible text.
    [self restoreHiddenSubviewsWithin:childComponentView];
    [super unmountChildComponentView:childComponentView index:index];
    [self setNeedsTextExtraction];
}

- (void)restoreHiddenSubviewsWithin:(UIView *)root
{
    if (!root) return;
    if ([_hiddenSubviews containsObject:root]) {
        root.hidden = NO;
        [_hiddenSubviews removeObject:root];
    }
    for (UIView *sub in root.subviews) {
        [self restoreHiddenSubviewsWithin:sub];
    }
}

- (void)finalizeUpdates:(RNComponentViewUpdateMask)updateMask
{
    [super finalizeUpdates:updateMask];
    // Called by the Fabric mounting layer once per commit. Children's own
    // prop updates (e.g. streamed attributedText changes) don't necessarily
    // alter our bounds, so layoutSubviews isn't guaranteed to fire — we
    // must re-extract here so the last streamed tokens always appear.
    [self setNeedsTextExtraction];
}

- (void)layoutSubviews
{
    [super layoutSubviews];
    [self updateTextViewContent];
}

- (void)setNeedsTextExtraction
{
    // Coalesce: multiple triggers in one commit schedule only one extraction.
    if (_extractionScheduled) {
        return;
    }
    _extractionScheduled = YES;

    __weak LLMSelectableTextView *weakSelf = self;
    // Pass 1: next runloop tick — usually enough for prop propagation.
    dispatch_async(dispatch_get_main_queue(), ^{
        [weakSelf updateTextViewContent];
        // Pass 2: safety retry ~100ms later. On first mount, Fabric's
        // RCTParagraphComponentView can project its attributedText to UIKit
        // *after* finalizeUpdates/layoutSubviews — so the first pass can
        // read an empty or truncated string. The retry catches that (it's
        // idempotent — same attributedText in means the UITextView's value
        // is just re-set to itself, no visible flicker).
        dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(0.1 * NSEC_PER_SEC)),
                       dispatch_get_main_queue(),
                       ^{
            LLMSelectableTextView *s = weakSelf;
            if (!s) return;
            [s updateTextViewContent];
            s->_extractionScheduled = NO;
        });
    });
}

- (void)updateTextViewContent
{
    // Clean slate: unhide everything we previously hid, then re-hide the
    // views that still carry text during this extraction pass. Prevents stale
    // hidden=YES on nodes whose text changed to empty between commits.
    for (UIView *v in [_hiddenSubviews allObjects]) {
        v.hidden = NO;
    }
    [_hiddenSubviews removeAllObjects];

    NSMutableAttributedString *combinedAttributedText = [[NSMutableAttributedString alloc] init];
    [self extractStyledTextFromView:self intoAttributedString:combinedAttributedText hideViews:YES];
    _textView.attributedText = combinedAttributedText;
}

- (void)extractStyledTextFromView:(UIView *)view intoAttributedString:(NSMutableAttributedString *)attributedString hideViews:(BOOL)hideViews
{
    BOOL foundText = NO;

    if ([view respondsToSelector:@selector(attributedText)]) {
        NSAttributedString *attributedText = [view performSelector:@selector(attributedText)];
        if (attributedText && attributedText.length > 0) {
            [attributedString appendAttributedString:attributedText];
            foundText = YES;
        }
    }
    else if ([view isKindOfClass:[UILabel class]]) {
        UILabel *label = (UILabel *)view;
        if (label.attributedText && label.attributedText.length > 0) {
            [attributedString appendAttributedString:label.attributedText];
            foundText = YES;
        } else if (label.text && label.text.length > 0) {
            [attributedString appendAttributedString:[[NSAttributedString alloc] initWithString:label.text]];
            foundText = YES;
        }
    }
    else if ([view respondsToSelector:@selector(text)]) {
        NSString *text = [view performSelector:@selector(text)];
        if (text && text.length > 0) {
            [attributedString appendAttributedString:[[NSAttributedString alloc] initWithString:text]];
            foundText = YES;
        }
    }

    if (foundText) {
        if (hideViews) {
            view.hidden = YES;
            [_hiddenSubviews addObject:view];
        }
        // Don't recurse into children of a view that already supplied text —
        // on Fabric, nested <Text> spans may or may not produce separate
        // UIView subviews, and we'd otherwise double-append their content.
        return;
    }

    for (UIView *subview in view.subviews) {
        if (subview != _textView) {
            [self extractStyledTextFromView:subview intoAttributedString:attributedString hideViews:hideViews];
        }
    }
}

#pragma mark - UITextViewDelegate

- (UIMenu *)textView:(UITextView *)textView
    editMenuForTextInRange:(NSRange)range
    suggestedActions:(NSArray<UIMenuElement *> *)suggestedActions API_AVAILABLE(ios(16.0))
{
    // No custom actions declared → hand back the system default menu so the
    // user at least gets Copy / Look Up / Share / Translate.
    if (_menuOptions.count == 0) {
        return [UIMenu menuWithTitle:@"" children:suggestedActions];
    }

    NSMutableArray<UIMenuElement *> *children =
        [NSMutableArray arrayWithCapacity:_menuOptions.count + suggestedActions.count];

    __weak LLMSelectableTextView *weakSelf = self;
    for (NSString *option in _menuOptions) {
        NSString *title = option;
        UIAction *action = [UIAction actionWithTitle:title
                                                image:nil
                                            identifier:nil
                                              handler:^(__kindof UIAction * _Nonnull a) {
            [weakSelf handleMenuSelection:title];
        }];
        [children addObject:action];
    }
    // Append the system suggestions after the custom actions so users still
    // have Copy / Look Up / Share available alongside the app-provided items.
    [children addObjectsFromArray:suggestedActions];
    return [UIMenu menuWithTitle:@"" children:children];
}

- (BOOL)canBecomeFirstResponder
{
    return YES;
}

- (void)handleMenuSelection:(NSString *)selectedOption
{
    NSRange selectedRange = _textView.selectedRange;
    NSString *selectedText = @"";

    if (selectedRange.location != NSNotFound && selectedRange.length > 0) {
        selectedText = [_textView.text substringWithRange:selectedRange];
    }

    _textView.selectedRange = NSMakeRange(0, 0);

    if (auto eventEmitter = std::static_pointer_cast<const LLMSelectableTextViewEventEmitter>(_eventEmitter)) {
        LLMSelectableTextViewEventEmitter::OnSelection selectionEvent = {
            .chosenOption = std::string([selectedOption UTF8String]),
            .highlightedText = std::string([selectedText UTF8String])
        };
        eventEmitter->onSelection(selectionEvent);
    }
}

Class<RCTComponentViewProtocol> LLMSelectableTextViewCls(void)
{
    return LLMSelectableTextView.class;
}

@end
