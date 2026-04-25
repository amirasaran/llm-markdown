import { defineConfig } from 'tsup';

const sharedExternals = [
  'react',
  'react-dom',
  'react-native',
  'react-native-reanimated',
  'framer-motion',
];

export default defineConfig([
  {
    entry: {
      index: 'src/index.ts',
      core: 'src/core/index.ts',
      web: 'src/web/index.tsx',
      native: 'src/native/index.tsx',
    },
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: false,
    treeshake: true,
    splitting: false,
    external: sharedExternals,
  },
  {
    // Expo DOM component. The `'use dom'` directive must be at the top of
    // the shipped file so the consumer's Metro transformer replaces the
    // module with a WebView proxy. Set via tsup's `banner`; also belt-and-
    // braces prepended by scripts/ensure-use-dom.mjs in case esbuild strips
    // it when running multiple configs in parallel.
    entry: { 'native-dom': 'src/native/dom/index.tsx' },
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: false,
    treeshake: true,
    splitting: false,
    banner: { js: "'use dom';" },
    external: [...sharedExternals, 'expo', 'expo/dom', 'react-native-webview'],
  },
]);
