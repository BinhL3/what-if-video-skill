import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'node:path';

const frames = process.argv.slice(2).map(Number);
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const chromiumOptions = {gl: 'angle'};
const composition = await selectComposition({serveUrl, id: 'WhatIf', chromiumOptions});
for (const frame of frames) {
	await renderStill({composition, serveUrl, frame, output: `out/stills/f${frame}.png`, chromiumOptions, scale: 0.5});
	console.log('frame', frame);
}
