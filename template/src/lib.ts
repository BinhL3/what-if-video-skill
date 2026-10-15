export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const ramp = (f: number, a: number, b: number) => clamp((f - a) / (b - a));
export const smooth = (x: number) => x * x * (3 - 2 * x);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const lerp3 = (a: number[], b: number[], t: number): [number, number, number] => [
	lerp(a[0], b[0], t),
	lerp(a[1], b[1], t),
	lerp(a[2], b[2], t),
];
export const hash = (n: number) => {
	const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
	return s - Math.floor(s);
};
export const shake = (f: number, start: number, len: number, amp: number) => {
	const k = f < start || f > start + len ? 0 : 1 - (f - start) / len;
	return [Math.sin(f * 2.7) * amp * k, Math.cos(f * 3.9) * amp * k, 0];
};
export type V3 = [number, number, number];
