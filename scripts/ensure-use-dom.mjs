#!/usr/bin/env node
// Prepends `"use dom";` to the native-dom bundle outputs if it isn't already
// the first non-empty line. The Expo DOM transformer inspects the top of the
// resolved module; if the directive is missing the module is loaded as
// regular code and WebView proxying never happens.
import fs from 'node:fs';
import path from 'node:path';

const dist = path.resolve(process.cwd(), 'dist');
const targets = ['native-dom.js', 'native-dom.cjs'];

for (const file of targets) {
  const full = path.join(dist, file);
  if (!fs.existsSync(full)) continue;
  let src = fs.readFileSync(full, 'utf8');

  // 1. Ensure `'use dom';` is the first line. Expo DOM's Metro transformer
  //    inspects the top of the module for this directive.
  const firstLine = src.split('\n', 1)[0].trim();
  const needsBanner = firstLine !== "'use dom';" && firstLine !== '"use dom";';
  if (needsBanner) {
    const withoutStrict = src.replace(/^\s*['"]use strict['"];\s*\n?/, '');
    src = `'use dom';\n${withoutStrict}`;
  }

  // 2. Expo DOM's transformer rejects modules that don't use the bare
  //    `export default X` form. Rewrite `export { X as default };` into a
  //    default declaration. ESM only — CJS uses module.exports.
  let rewroteDefault = false;
  if (file.endsWith('.js')) {
    const m = src.match(/export\s*\{\s*([A-Za-z_$][\w$]*)\s+as\s+default\s*\}\s*;?/);
    if (m) {
      src = src.replace(m[0], `export default ${m[1]};`);
      rewroteDefault = true;
    }
  }

  // 3. Collapse duplicate `//# sourceMappingURL=…` trailers that sneak in when
  //    tsup runs multiple configs in parallel.
  src = src.replace(/(\/\/# sourceMappingURL=.*\n)(?:\/\/# sourceMappingURL=.*\n?)+/g, '$1');

  if (needsBanner || rewroteDefault) {
    fs.writeFileSync(full, src);
    const parts = [];
    if (needsBanner) parts.push("prepended 'use dom'");
    if (rewroteDefault) parts.push('rewrote default export');
    console.log(`[ensure-use-dom] dist/${file}: ${parts.join(', ')}`);
  }
}
