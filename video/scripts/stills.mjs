// Render a handful of frames of a composition for visual QA.
// usage: node scripts/stills.mjs <compositionId> <frame,frame,...> [outDir]
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
import path from 'node:path';
import fs from 'node:fs';

const [id, framesArg, outDir = 'out/stills'] = process.argv.slice(2);
const frames = framesArg.split(',').map(Number);
const browserExecutable = process.env.REMOTION_BROWSER || null;
fs.mkdirSync(outDir, { recursive: true });
const serveUrl = await bundle({ entryPoint: path.resolve('src/index.ts') });
const composition = await selectComposition({ serveUrl, id, browserExecutable });
for (const frame of frames) {
  const output = path.join(outDir, `${id}-${String(frame).padStart(4, '0')}.png`);
  await renderStill({ composition, serveUrl, output, frame, browserExecutable, scale: 0.5 });
  console.log('wrote', output);
}
