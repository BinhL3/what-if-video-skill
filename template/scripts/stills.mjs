// Render individual frames fast (no full video) and tile them into a contact sheet.
//   node scripts/stills.mjs --beats          one frame from the middle of every beat
//   node scripts/stills.mjs 30 95 210        specific frames
// Output: out/stills/f<frame>.png and out/stills/sheet.png (needs ffmpeg for the sheet).
// Look at the sheet after every change: most problems (blocked shots, cropped text,
// objects hidden inside furniture) are only visible in the picture.
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const cfg = JSON.parse(fs.readFileSync('beats.json', 'utf8'));
let frames = process.argv.slice(2).filter((a) => !a.startsWith('--')).map(Number);
if (process.argv.includes('--beats')) {
	let start = 0;
	frames = cfg.beats.map((b) => {
		const mid = start + Math.floor(b.frames / 2);
		start += b.frames;
		return mid;
	});
}
if (!frames.length) {
	console.error('usage: node scripts/stills.mjs --beats | <frame> [frame…]');
	process.exit(1);
}
if (!fs.existsSync('public/soundtrack.wav')) {
	console.error('public/soundtrack.wav is missing: run `npm run sound` first');
	process.exit(1);
}
fs.mkdirSync('out/stills', {recursive: true});
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const chromiumOptions = {gl: 'angle'};
const composition = await selectComposition({serveUrl, id: 'WhatIf', chromiumOptions});
const files = [];
for (const frame of frames) {
	const output = `out/stills/f${frame}.png`;
	await renderStill({composition, serveUrl, frame, output, chromiumOptions, scale: 0.5});
	files.push(output);
	console.log('rendered', output);
}
const args = ['-loglevel', 'error', '-y', ...files.flatMap((f) => ['-i', f])];
args.push(...(files.length > 1 ? ['-filter_complex', `hstack=${files.length}`] : []), 'out/stills/sheet.png');
execFileSync('ffmpeg', args);
console.log('contact sheet: out/stills/sheet.png');
