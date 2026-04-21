module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Reanimated 4 split worklets into their own package. Plugin must be last
    // so it can wrap transformed code.
    plugins: ['react-native-worklets/plugin'],
  };
};
