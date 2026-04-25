module.exports = {
  dependency: {
    platforms: {
      ios: {
        podspecPath: require('path').join(__dirname, 'LLMSelectableText.podspec'),
      },
      android: {
        sourceDir: './native/android',
        packageImportPath: 'import dev.llmmarkdown.selectabletext.LLMSelectableTextViewPackage;',
        packageInstance: 'new LLMSelectableTextViewPackage()',
      },
    },
  },
};
