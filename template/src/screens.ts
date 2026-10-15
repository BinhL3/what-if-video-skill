// 2D canvas drawings for in-world screens (monitors, phones, signs). Keep every UI fictional:
// look-alikes of real apps are fine, real logos, names and sounds are not.
import {clamp} from './lib';

type C = CanvasRenderingContext2D;
const SANS = 'Helvetica, Arial, sans-serif';

// CSS font shorthand order matters: style, weight, size, family ("italic 700 30px …").
// A malformed string is silently ignored and the text renders at 10px.
export const font = (ctx: C, px: number, w = 600, style = '') => (ctx.font = `${style} ${w} ${px}px ${SANS}`.trim());

export const rr = (ctx: C, x: number, y: number, w: number, h: number, r: number, fill: string) => {
	ctx.fillStyle = fill;
	ctx.beginPath();
	ctx.roundRect(x, y, w, h, r);
	ctx.fill();
};

export const text = (ctx: C, s: string, x: number, y: number, px: number, color: string, w = 600, align: CanvasTextAlign = 'left') => {
	font(ctx, px, w);
	ctx.fillStyle = color;
	ctx.textAlign = align;
	ctx.textBaseline = 'middle';
	ctx.fillText(s, x, y);
};

export const spinner = (ctx: C, x: number, y: number, r: number, f: number, color: string) => {
	ctx.strokeStyle = color;
	ctx.lineWidth = r * 0.28;
	ctx.lineCap = 'round';
	ctx.beginPath();
	const a = f * 0.25;
	ctx.arc(x, y, r, a, a + 4.2);
	ctx.stroke();
};

// Example: a chat app whose unread badge climbs to 99+. Make on-screen words big enough to read
// on a phone; small text only works as texture.
export const alertScreen = (f: number) => (ctx: C, W: number, H: number) => {
	ctx.fillStyle = '#f4f2ee';
	ctx.fillRect(0, 0, W, H);
	ctx.fillStyle = '#3b2a4f';
	ctx.fillRect(0, 0, W * 0.27, H);
	text(ctx, 'Chatter', 18, 26, 20, '#fff', 700);
	const count = Math.round(3 + clamp(f / 60) * 96);
	const label = count >= 99 ? '99+' : String(count);
	rr(ctx, W - 150, 10, 136, 40, 20, '#e0245e');
	text(ctx, `${label} unread`, W - 82, 31, 20, '#fff', 800, 'center');
	const msgs = ['Where is everyone?', 'Server alert: disk 91%', 'Client call in 5 min??', 'Is anyone seeing this', 'ALERT: backups failed'];
	const shown = clamp(Math.floor(1 + f / 18), 1, msgs.length);
	for (let i = 0; i < shown; i++) {
		const y = H - 34 - (shown - 1 - i) * 46;
		rr(ctx, W * 0.3, y - 18, 30, 30, 6, i % 2 ? '#e0245e' : '#4a90d9');
		text(ctx, msgs[i], W * 0.3 + 42, y - 2, 17, '#222', 600);
	}
	if (f < 6 || count < 99) spinner(ctx, W * 0.13, H * 0.8, 18, f, '#c9bfd6');
};

export const codeScreen = (ctx: C, W: number, H: number) => {
	ctx.fillStyle = '#1e2229';
	ctx.fillRect(0, 0, W, H);
	const cols = ['#c678dd', '#61afef', '#98c379', '#e5c07b', '#abb2bf'];
	for (let i = 0; i < 14; i++) {
		ctx.fillStyle = cols[i % cols.length];
		ctx.fillRect(W * 0.08 + (i % 4) * 14, 16 + i * (H / 15), W * (0.2 + ((i * 37) % 50) / 100), H / 32);
	}
};
