// The single source of truth for timing. beats.json is also read by scripts/soundtrack.py,
// so inserting, removing or resizing a beat keeps picture and sound in sync automatically.
import file from '../beats.json';

export type StatSet = {from: number; items: [string, string][]};
export type Beat = {
	id: string;
	frames: number;
	start: number;
	countdown?: string;
	stats?: StatSet[];
	captions?: [number, number, string][];
	chyron?: [number, number, string, string];
};

let cursor = 0;
export const BEATS: Beat[] = (file.beats as Omit<Beat, 'start'>[]).map((b) => {
	const beat = {...b, start: cursor};
	cursor += b.frames;
	return beat;
});
export const TOTAL_FRAMES = cursor;
export const FPS = file.fps;
export const WIDTH = file.width;
export const HEIGHT = file.height;
export const FADE_OUT = file.fadeOutFrames;

export const beatAt = (g: number) => BEATS.find((b) => g >= b.start && g < b.start + b.frames) ?? BEATS[BEATS.length - 1];
