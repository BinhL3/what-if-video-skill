// 2D canvas drawings for every in-world screen. All UIs are fictional look-alikes.
import {clamp, hash} from './lib';

type C = CanvasRenderingContext2D;
const SANS = 'Helvetica, Arial, sans-serif';
const font = (ctx: C, px: number, w = 600) => (ctx.font = `${w} ${px}px ${SANS}`);
const rr = (ctx: C, x: number, y: number, w: number, h: number, r: number, fill: string) => {
	ctx.fillStyle = fill;
	ctx.beginPath();
	ctx.roundRect(x, y, w, h, r);
	ctx.fill();
};
const text = (ctx: C, s: string, x: number, y: number, px: number, color: string, w = 600, align: CanvasTextAlign = 'left') => {
	font(ctx, px, w);
	ctx.fillStyle = color;
	ctx.textAlign = align;
	ctx.textBaseline = 'middle';
	ctx.fillText(s, x, y);
};
const spinner = (ctx: C, x: number, y: number, r: number, f: number, color: string) => {
	ctx.strokeStyle = color;
	ctx.lineWidth = r * 0.28;
	ctx.lineCap = 'round';
	ctx.beginPath();
	const a = f * 0.25;
	ctx.arc(x, y, r, a, a + 4.2);
	ctx.stroke();
};

// ---- office code editor (static background monitors) ----
export const codeScreen = (seed: number) => (ctx: C, W: number, H: number) => {
	ctx.fillStyle = '#1e2229';
	ctx.fillRect(0, 0, W, H);
	ctx.fillStyle = '#171a20';
	ctx.fillRect(0, 0, W * 0.18, H);
	const cols = ['#c678dd', '#61afef', '#98c379', '#e5c07b', '#abb2bf', '#56b6c2'];
	for (let i = 0; i < 16; i++) {
		const y = 14 + i * (H / 17);
		const indent = (Math.floor(hash(seed + i) * 4) * W) / 30;
		let x = W * 0.22 + indent;
		const parts = 1 + Math.floor(hash(seed * 3 + i) * 4);
		for (let j = 0; j < parts; j++) {
			const w = 20 + hash(seed + i * 7 + j) * (W * 0.16);
			ctx.fillStyle = cols[Math.floor(hash(seed + i + j * 5) * cols.length)];
			ctx.fillRect(x, y, w, H / 34);
			x += w + 8;
		}
	}
};

// ---- fictional team chat ("Chatter") with unread badge and incoming call ----
export const chatScreen = (o: {count: number; f: number; ring?: number; dusk?: boolean}) => (ctx: C, W: number, H: number) => {
	ctx.fillStyle = '#f4f2ee';
	ctx.fillRect(0, 0, W, H);
	ctx.fillStyle = '#3b2a4f';
	ctx.fillRect(0, 0, W * 0.27, H);
	text(ctx, 'Chatter', 18, 26, 20, '#fff', 700);
	const chans = ['# incidents', '# payments', '# deploys', '# eng-oncall', '@ ops-dana'];
	chans.forEach((c, i) => {
		const y = 70 + i * 34;
		text(ctx, c, 18, y, 15, i === 0 ? '#fff' : '#c9bfd6', i === 0 ? 700 : 500);
		const n = i === 0 ? o.count : Math.floor(o.count * [0, 0.4, 0.2, 0.6, 0.3][i]);
		if (n > 0) {
			const label = n >= 99 ? '99+' : String(n);
			rr(ctx, W * 0.27 - 44, y - 11, 34, 22, 11, '#e0245e');
			text(ctx, label, W * 0.27 - 27, y + 1, 13, '#fff', 700, 'center');
		}
	});
	// message pane
	const msgs = [
		['ALERT', 'payments-api error rate 4%'],
		['ALERT', 'checkout latency p95 > 3s'],
		['Dana (Ops)', '@eng-oncall can anyone take this?'],
		['ALERT', 'payments-api error rate 12%'],
		['Dana (Ops)', 'calling the on-call now'],
		['ALERT', 'cert renewal job FAILED'],
		['Dana (Ops)', 'is anyone from engineering here??'],
	];
	const shown = clamp(Math.floor(1 + o.count / 15), 1, msgs.length);
	const x0 = W * 0.3;
	for (let i = 0; i < shown; i++) {
		const [who, m] = msgs[msgs.length - shown + i];
		const y = H - 30 - (shown - 1 - i) * 42;
		if (y < 50) continue;
		const alert = who === 'ALERT';
		rr(ctx, x0, y - 17, 26, 26, 5, alert ? '#e0245e' : '#4a90d9');
		text(ctx, who, x0 + 36, y - 7, 13, alert ? '#c0163f' : '#222', 700);
		text(ctx, m, x0 + 36, y + 10, 14, '#333', 500);
	}
	ctx.fillStyle = '#e6e2dc';
	ctx.fillRect(x0 - 10, 0, W, 40);
	text(ctx, '# incidents', x0, 20, 17, '#222', 700);
	// big unread badge
	const label = o.count >= 99 ? '99+' : String(o.count);
	rr(ctx, W - 110, 6, 96, 30, 15, '#e0245e');
	text(ctx, `${label} unread`, W - 62, 22, 14, '#fff', 700, 'center');
	if (o.ring !== undefined && o.ring > 0) {
		const a = Math.min(1, o.ring);
		ctx.globalAlpha = a;
		ctx.fillStyle = 'rgba(0,0,0,0.35)';
		ctx.fillRect(0, 0, W, H);
		const cw = W * 0.52;
		const ch = H * 0.62;
		const cx = (W - cw) / 2;
		const cy = (H - ch) / 2;
		rr(ctx, cx, cy, cw, ch, 14, '#2b2c4a');
		const pulse = (o.f % 24) / 24;
		ctx.strokeStyle = `rgba(155,160,255,${1 - pulse})`;
		ctx.lineWidth = 4;
		ctx.beginPath();
		ctx.arc(W / 2, cy + ch * 0.36, 30 + pulse * 26, 0, Math.PI * 2);
		ctx.stroke();
		ctx.fillStyle = '#7b83eb';
		ctx.beginPath();
		ctx.arc(W / 2, cy + ch * 0.36, 30, 0, Math.PI * 2);
		ctx.fill();
		text(ctx, 'D', W / 2, cy + ch * 0.36 + 2, 28, '#fff', 700, 'center');
		text(ctx, 'Incoming call', W / 2, cy + ch * 0.64, 18, '#fff', 700, 'center');
		text(ctx, 'Dana (Ops) → Engineering', W / 2, cy + ch * 0.75, 13, '#c8c9f0', 500, 'center');
		rr(ctx, W / 2 - 70, cy + ch * 0.83, 56, 26, 13, '#d13438');
		rr(ctx, W / 2 + 14, cy + ch * 0.83, 56, 26, 13, '#2fa84f');
		ctx.globalAlpha = 1;
	}
	if (o.dusk) {
		ctx.fillStyle = 'rgba(20,10,40,0.12)';
		ctx.fillRect(0, 0, W, H);
	}
};

// ---- recovered dashboard: message sent, payment approved, call connected ----
export const restoredScreen = (f: number) => (ctx: C, W: number, H: number) => {
	ctx.fillStyle = '#f4f2ee';
	ctx.fillRect(0, 0, W, H);
	ctx.fillStyle = '#3b2a4f';
	ctx.fillRect(0, 0, W, 38);
	text(ctx, 'Chatter', 16, 20, 18, '#fff', 700);
	text(ctx, '0 unread', W - 16, 20, 14, '#cfe9d4', 700, 'right');
	const panel = (i: number, title: string, body: string, on: number) => {
		const y = 52 + i * ((H - 60) / 3);
		const h = (H - 60) / 3 - 10;
		rr(ctx, 14, y, W - 28, h, 10, on > 0 ? '#e3f5e7' : '#ffffff');
		ctx.strokeStyle = on > 0 ? '#2fa84f' : '#ddd';
		ctx.lineWidth = 3;
		ctx.beginPath();
		ctx.roundRect(14, y, W - 28, h, 10);
		ctx.stroke();
		const cx = 48;
		const cy = y + h / 2;
		if (on > 0) {
			ctx.fillStyle = '#2fa84f';
			ctx.beginPath();
			ctx.arc(cx, cy, 20, 0, Math.PI * 2);
			ctx.fill();
			ctx.strokeStyle = '#fff';
			ctx.lineWidth = 5;
			ctx.beginPath();
			ctx.moveTo(cx - 9, cy);
			ctx.lineTo(cx - 2, cy + 8);
			ctx.lineTo(cx + 10, cy - 8);
			ctx.stroke();
		} else {
			spinner(ctx, cx, cy, 14, f, '#999');
		}
		text(ctx, title, 82, cy - 12, 20, '#1d1d1d', 700);
		text(ctx, body, 82, cy + 14, 15, '#555', 500);
	};
	panel(0, f > 4 ? 'Message sent' : 'Sending…', '“deploy looks good 🚀”', f > 4 ? 1 : 0);
	panel(1, f > 18 ? 'Payment approved' : 'Processing payment…', '$12.40 · card ending 4242', f > 18 ? 1 : 0);
	const secs = Math.max(0, Math.floor((f - 32) / 30));
	panel(2, f > 32 ? `Call connected · 00:0${secs}` : 'Calling Dana (Ops)…', f > 32 ? 'Dana (Ops) answered' : 'ringing', f > 32 ? 1 : 0);
};

// ---- card terminal ----
export const terminalScreen = (state: 'processing' | 'retry' | 'failed', f: number, retry = 1) => (ctx: C, W: number, H: number) => {
	ctx.fillStyle = state === 'failed' ? '#3b0d10' : '#10161c';
	ctx.fillRect(0, 0, W, H);
	text(ctx, 'TOTAL', W / 2, H * 0.12, 22, '#9fb1c2', 600, 'center');
	text(ctx, '$12.40', W / 2, H * 0.23, 44, '#fff', 700, 'center');
	if (state === 'failed') {
		ctx.fillStyle = '#ff3b3b';
		ctx.beginPath();
		ctx.arc(W / 2, H * 0.47, 46, 0, Math.PI * 2);
		ctx.fill();
		ctx.strokeStyle = '#fff';
		ctx.lineWidth = 10;
		ctx.lineCap = 'round';
		ctx.beginPath();
		ctx.moveTo(W / 2 - 18, H * 0.47 - 18);
		ctx.lineTo(W / 2 + 18, H * 0.47 + 18);
		ctx.moveTo(W / 2 + 18, H * 0.47 - 18);
		ctx.lineTo(W / 2 - 18, H * 0.47 + 18);
		ctx.stroke();
		text(ctx, 'PAYMENT', W / 2, H * 0.67, 44, '#fff', 800, 'center');
		text(ctx, 'FAILED', W / 2, H * 0.77, 44, '#fff', 800, 'center');
		text(ctx, 'Error: certificate expired', W / 2, H * 0.89, 17, '#ffb3b3', 500, 'center');
	} else {
		spinner(ctx, W / 2, H * 0.5, 40, f, '#4fc3f7');
		text(ctx, state === 'processing' ? 'PROCESSING…' : `RETRYING (${retry}/3)…`, W / 2, H * 0.72, 30, '#fff', 700, 'center');
		text(ctx, 'Please wait', W / 2, H * 0.82, 20, '#9fb1c2', 500, 'center');
	}
};

// ---- phone apps failing ----
const statusBar = (ctx: C, W: number) => {
	text(ctx, '9:41', 16, 16, 14, '#111', 700);
	text(ctx, 'No service', W - 14, 16, 12, '#c22', 700, 'right');
};
export const phoneChat = (f: number, failed: boolean) => (ctx: C, W: number, H: number) => {
	ctx.fillStyle = '#ffffff';
	ctx.fillRect(0, 0, W, H);
	statusBar(ctx, W);
	ctx.fillStyle = '#f2f2f5';
	ctx.fillRect(0, 30, W, 46);
	text(ctx, 'Mom', W / 2, 53, 18, '#111', 700, 'center');
	rr(ctx, 14, 110, W * 0.62, 50, 18, '#e9e9eb');
	text(ctx, 'are you ok?? everything is down', 26, 135, 12, '#111', 500);
	const by = H * 0.5;
	rr(ctx, W * 0.3, by, W * 0.62, 50, 18, failed ? '#9cc4ff' : '#1e7cf2');
	text(ctx, 'I’m fine, phone barely works', W * 0.33, by + 25, 12, '#fff', 600);
	if (failed) {
		ctx.fillStyle = '#e02424';
		ctx.beginPath();
		ctx.arc(W * 0.2, by + 25, 15, 0, Math.PI * 2);
		ctx.fill();
		text(ctx, '!', W * 0.2, by + 26, 22, '#fff', 800, 'center');
		text(ctx, 'Not delivered', W - 22, by + 72, 18, '#e02424', 700, 'right');
	} else {
		spinner(ctx, W * 0.2, by + 25, 10, f, '#999');
	}
};
export const phoneMap = (f: number, failed: boolean) => (ctx: C, W: number, H: number) => {
	ctx.fillStyle = '#e4e2dd';
	ctx.fillRect(0, 0, W, H);
	ctx.strokeStyle = '#d2cfc8';
	ctx.lineWidth = 2;
	for (let i = 0; i < 10; i++) {
		ctx.strokeRect((i % 3) * (W / 3), Math.floor(i / 3) * (H / 4), W / 3, H / 4);
	}
	statusBar(ctx, W);
	rr(ctx, 12, 32, W - 24, 40, 20, '#fff');
	text(ctx, 'Search here', 30, 52, 15, '#888', 500);
	if (failed) {
		rr(ctx, 20, H * 0.42, W - 40, 110, 14, '#ffffff');
		text(ctx, 'Map can’t load', W / 2, H * 0.42 + 36, 20, '#111', 700, 'center');
		text(ctx, 'Check your connection', W / 2, H * 0.42 + 70, 14, '#777', 500, 'center');
	}
	spinner(ctx, W / 2, H * 0.32, 22, f, '#4285f4');
};
export const phoneBank = (f: number, failed: boolean) => (ctx: C, W: number, H: number) => {
	ctx.fillStyle = '#0f3d2e';
	ctx.fillRect(0, 0, W, H);
	text(ctx, '9:41', 16, 16, 14, '#fff', 700);
	text(ctx, 'My Bank', W / 2, 62, 24, '#fff', 800, 'center');
	if (failed) {
		rr(ctx, 16, H * 0.3, W - 32, H * 0.36, 14, '#ffffff');
		ctx.fillStyle = '#e02424';
		ctx.beginPath();
		ctx.arc(W / 2, H * 0.38, 22, 0, Math.PI * 2);
		ctx.fill();
		text(ctx, '!', W / 2, H * 0.385, 28, '#fff', 800, 'center');
		text(ctx, 'Service', W / 2, H * 0.48, 24, '#111', 800, 'center');
		text(ctx, 'unavailable', W / 2, H * 0.535, 24, '#111', 800, 'center');
		text(ctx, 'Please try again later.', W / 2, H * 0.6, 13, '#666', 500, 'center');
	} else {
		spinner(ctx, W / 2, H * 0.45, 26, f, '#7ee2b8');
		text(ctx, 'Signing in…', W / 2, H * 0.56, 16, '#cfeee0', 600, 'center');
	}
};

// ---- airport departures board ----
export const departures = (f: number) => (ctx: C, W: number, H: number) => {
	ctx.fillStyle = '#0b0d12';
	ctx.fillRect(0, 0, W, H);
	text(ctx, 'DEPARTURES', 24, 34, 30, '#ffd23f', 800);
	text(ctx, 'OUTAGE · HANDWRITTEN BOARDING PASSES', W - 24, 34, 22, f % 30 < 18 ? '#ff5a4f' : '#7a2a26', 800, 'right');
	const rows = [
		['08:05', 'SEATTLE', 'DELAYED'],
		['08:20', 'LOS ANGELES', 'DELAYED'],
		['08:35', 'DENVER', 'MANUAL'],
		['08:50', 'NEW YORK', 'DELAYED'],
		['09:10', 'HONOLULU', 'MANUAL'],
		['09:25', 'CHICAGO', 'DELAYED'],
	];
	rows.forEach((r, i) => {
		const y = 90 + i * ((H - 100) / rows.length);
		ctx.fillStyle = i % 2 ? '#12151c' : '#161a23';
		ctx.fillRect(10, y - 22, W - 20, (H - 100) / rows.length - 4);
		text(ctx, r[0], 28, y, 26, '#e8e8e8', 700);
		text(ctx, r[1], 140, y, 26, '#e8e8e8', 700);
		text(ctx, r[2], W - 28, y, 26, r[2] === 'DELAYED' ? '#ff7a45' : '#ffd23f', 800, 'right');
	});
};

// ---- student laptop: terminal reading docs and fixing ----
export const laptopScreen = (f: number) => (ctx: C, W: number, H: number) => {
	ctx.fillStyle = '#14161b';
	ctx.fillRect(0, 0, W, H);
	ctx.fillStyle = '#23262e';
	ctx.fillRect(0, 0, W, 22);
	['#ff5f57', '#febc2e', '#28c840'].forEach((c, i) => {
		ctx.fillStyle = c;
		ctx.beginPath();
		ctx.arc(14 + i * 16, 11, 5, 0, Math.PI * 2);
		ctx.fill();
	});
	const lines: [string, string][] = [
		['$ git clone payments-service', '#e6e6e6'],
		['$ less docs/RUNBOOK.md', '#e6e6e6'],
		['  “If cert renewal fails, run…”', '#9aa4b2'],
		['$ ./scripts/renew-cert --dry-run', '#e6e6e6'],
		['  ok · 1 cert expired', '#e5c07b'],
		['$ make test', '#e6e6e6'],
		['  ✓ 12 passed', '#28c840'],
		['  fix ready for review ✓', '#28c840'],
	];
	const n = clamp(Math.floor(f / 12), 0, lines.length);
	for (let i = 0; i < n; i++) {
		text(ctx, lines[i][0], 12, 38 + i * 21, 15, lines[i][1], 600);
	}
	if (f % 20 < 12) {
		ctx.fillStyle = '#e6e6e6';
		ctx.fillRect(14, 30 + n * 21, 8, 15);
	}
};

// ---- office windows skyline ----
export const skyline = (mode: 'day' | 'dusk') => (ctx: C, W: number, H: number) => {
	const g = ctx.createLinearGradient(0, 0, 0, H);
	if (mode === 'day') {
		g.addColorStop(0, '#bcd3e6');
		g.addColorStop(1, '#eef2f0');
	} else {
		g.addColorStop(0, '#2e2d5a');
		g.addColorStop(0.6, '#c9617a');
		g.addColorStop(1, '#ffb070');
	}
	ctx.fillStyle = g;
	ctx.fillRect(0, 0, W, H);
	for (let i = 0; i < 40; i++) {
		const w = 20 + hash(i) * 50;
		const h = H * (0.25 + hash(i + 9) * 0.55);
		const x = hash(i + 3) * W;
		ctx.fillStyle = mode === 'day' ? `rgba(120,135,150,${0.5 + hash(i + 2) * 0.3})` : `rgba(30,25,50,${0.75 + hash(i + 2) * 0.2})`;
		ctx.fillRect(x, H - h, w, h);
		if (mode === 'dusk') {
			for (let k = 0; k < 6; k++) {
				if (hash(i * 10 + k) > 0.5) {
					ctx.fillStyle = '#ffd98a';
					ctx.fillRect(x + 4 + hash(k + i) * (w - 8), H - h + 8 + k * (h / 7), 3, 3);
				}
			}
		}
	}
	// window mullions
	ctx.fillStyle = mode === 'day' ? '#9aa1a8' : '#2a2730';
	for (let x = 0; x < W; x += W / 8) ctx.fillRect(x, 0, 6, H);
};

// ---- missing engineer's phone: on-call page escalating with no answer ----
export const pagerScreen = (f: number) => (ctx: C, W: number, H: number) => {
	const flash = f % 16 < 8;
	ctx.fillStyle = flash ? '#c81e1e' : '#5a0d0d';
	ctx.fillRect(0, 0, W, H);
	text(ctx, 'ON-CALL PAGE', W / 2, H * 0.1, 26, '#fff', 800, 'center');
	text(ctx, 'SEV-1', W / 2, H * 0.24, 56, '#fff', 900, 'center');
	text(ctx, 'payments-api', W / 2, H * 0.36, 22, '#ffe0e0', 700, 'center');
	text(ctx, 'is DOWN', W / 2, H * 0.43, 22, '#ffe0e0', 700, 'center');
	rr(ctx, 16, H * 0.52, W - 32, 60, 12, 'rgba(0,0,0,0.35)');
	text(ctx, 'Unacknowledged', W / 2, H * 0.52 + 30, 20, '#fff', 700, 'center');
	const tries = clamp(1 + Math.floor(f / 40), 1, 9);
	text(ctx, `Escalation ${tries}/9 · no answer`, W / 2, H * 0.68, 16, '#ffd0d0', 600, 'center');
	rr(ctx, 30, H * 0.8, W - 60, 56, 28, '#2fa84f');
	text(ctx, 'ACKNOWLEDGE', W / 2, H * 0.8 + 29, 20, '#fff', 800, 'center');
};

// ---- news: tech stocks crash ----
export const stocksScreen = (f: number) => (ctx: C, W: number, H: number) => {
	ctx.fillStyle = '#0b1020';
	ctx.fillRect(0, 0, W, H);
	ctx.strokeStyle = '#1d2540';
	ctx.lineWidth = 2;
	for (let i = 1; i < 6; i++) {
		ctx.beginPath();
		ctx.moveTo(0, (i * H) / 6);
		ctx.lineTo(W, (i * H) / 6);
		ctx.stroke();
	}
	const k = clamp(f / 70);
	const n = Math.floor(80 * k) + 2;
	ctx.strokeStyle = '#ff3b3b';
	ctx.lineWidth = 7;
	ctx.beginPath();
	for (let i = 0; i < n; i++) {
		const x = 30 + (i / 80) * (W * 0.62);
		const fall = i < 12 ? 0 : Math.pow((i - 12) / 68, 0.7);
		const y = H * 0.3 + fall * H * 0.5 + (hash(i) - 0.5) * 22;
		if (i === 0) ctx.moveTo(x, y);
		else ctx.lineTo(x, y);
	}
	ctx.stroke();
	text(ctx, 'TECH 100', W * 0.7, H * 0.2, 44, '#fff', 800);
	const pct = Math.round(38 * k);
	text(ctx, `▼ ${pct}%`, W * 0.7, H * 0.4, 84, '#ff3b3b', 900);
	text(ctx, 'Biggest drop on record', W * 0.7, H * 0.56, 26, '#c9cfe0', 600);
	['CLOUD ▼41%', 'SOCIAL ▼36%', 'PAYMENTS ▼44%'].forEach((r, i) => text(ctx, r, W * 0.7, H * 0.68 + i * 40, 26, '#ff8080', 700));
};

// ---- government briefing backdrop ----
export const briefingScreen = (f: number) => (ctx: C, W: number, H: number) => {
	const g = ctx.createLinearGradient(0, 0, 0, H);
	g.addColorStop(0, '#13285a');
	g.addColorStop(1, '#0a1530');
	ctx.fillStyle = g;
	ctx.fillRect(0, 0, W, H);
	ctx.strokeStyle = '#d8b75a';
	ctx.lineWidth = 6;
	ctx.beginPath();
	ctx.arc(W / 2, H * 0.3, 70, 0, Math.PI * 2);
	ctx.stroke();
	for (let i = 0; i < 12; i++) {
		const a = (i / 12) * Math.PI * 2;
		ctx.fillStyle = '#d8b75a';
		ctx.beginPath();
		ctx.arc(W / 2 + Math.cos(a) * 48, H * 0.3 + Math.sin(a) * 48, 6, 0, Math.PI * 2);
		ctx.fill();
	}
	text(ctx, 'EMERGENCY TECH', W / 2, H * 0.6, 54, '#fff', 800, 'center');
	text(ctx, 'WORKFORCE INITIATIVE', W / 2, H * 0.72, 54, '#fff', 800, 'center');
	text(ctx, 'Student coders: apply today', W / 2, H * 0.86, 34, '#d8b75a', 700, 'center');
};

// ---- AI assistant tries to fix the outage and makes it worse ----
export const aiScreen = (f: number) => (ctx: C, W: number, H: number) => {
	ctx.fillStyle = '#f7f7f8';
	ctx.fillRect(0, 0, W, H);
	ctx.fillStyle = '#ececf1';
	ctx.fillRect(0, 0, W, 36);
	text(ctx, 'Local AI · offline model on this laptop', 14, 18, 16, '#222', 700);
	text(ctx, 'slow', W - 14, 18, 13, '#b26a00', 700, 'right');
	const bubble = (y: number, s: string, me: boolean, color?: string) => {
		font(ctx, 14, 600);
		const w = Math.min(W * 0.84, ctx.measureText(s).width + 24);
		rr(ctx, me ? W - w - 12 : 12, y, w, 28, 10, color ?? (me ? '#5b5bd6' : '#ffffff'));
		text(ctx, s, me ? W - w : 24, y + 14, 14, me || color ? '#fff' : '#222', 600);
	};
	rr(ctx, 12, 44, W - 24, 24, 6, '#fde8e8');
	text(ctx, '✕ Cloud AI unreachable (503) · switched to local model', 22, 56, 12, '#b42318', 700);
	if (f > 6) bubble(76, 'payments-api is down. write a fix', true);
	if (f > 14 && f <= 30) text(ctx, 'thinking' + '.'.repeat(1 + (Math.floor(f / 4) % 3)), 24, 120, 14, '#888', 600);
	if (f > 30) bubble(108, '✨ Here is a patch that should fix it', false);
	if (f > 40) {
		rr(ctx, 12, 142, W * 0.7, 48, 8, '#1e2229');
		text(ctx, '- retries: 3', 22, 156, 12, '#ff7b72', 600);
		text(ctx, '+ retries: 9999', 22, 176, 12, '#7ee787', 600);
	}
	if (f > 62) bubble(198, 'nobody can review it… deploying anyway', true);
	if (f > 82) bubble(234, 'ERROR RATE 12% → 31% ▲', false, '#c81e1e');
	if (f > 100) bubble(270, 'ERROR RATE 31% → 58% ▲  rollback failed', false, '#8a0f0f');
};

// ---- interview room ----
export const whiteboard = (ctx: C, W: number, H: number) => {
	ctx.fillStyle = '#f6f7f4';
	ctx.fillRect(0, 0, W, H);
	ctx.strokeStyle = '#1f4fa3';
	ctx.lineWidth = 5;
	ctx.lineCap = 'round';
	const box = (x: number, y: number, label: string) => {
		ctx.strokeRect(x, y, 150, 70);
		ctx.fillStyle = '#1f4fa3';
		ctx.font = 'italic 600 26px "Marker Felt", "Comic Sans MS", cursive';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillText(label, x + 75, y + 35);
	};
	box(40, 60, 'client');
	box(300, 60, 'API');
	box(560, 30, 'cache');
	box(560, 150, 'DB');
	ctx.beginPath();
	ctx.moveTo(190, 95);
	ctx.lineTo(300, 95);
	ctx.moveTo(450, 90);
	ctx.lineTo(560, 65);
	ctx.moveTo(450, 100);
	ctx.lineTo(560, 185);
	ctx.stroke();
	ctx.fillStyle = '#c0161f';
	ctx.font = 'italic 600 30px "Marker Felt", "Comic Sans MS", cursive';
	ctx.textAlign = 'left';
	ctx.fillText('Design a URL shortener', 40, H - 40);
};
export const interviewLaptop = (ctx: C, W: number, H: number) => {
	ctx.fillStyle = '#ffffff';
	ctx.fillRect(0, 0, W, H);
	ctx.fillStyle = '#eef1f6';
	ctx.fillRect(0, 0, W, 30);
	text(ctx, 'Interview · Round 2 · System design', 12, 15, 14, '#222', 700);
	['Candidate: Sam R.', 'Q2: scale to 10M users?', 'Notes: strong on caching…'].forEach((l, i) => text(ctx, l, 14, 56 + i * 30, 15, '#333', 500));
};

// ---- red dashboards on the other monitors at dusk ----
export const redScreen = (seed: number) => (ctx: C, W: number, H: number) => {
	ctx.fillStyle = '#2a0b0e';
	ctx.fillRect(0, 0, W, H);
	text(ctx, 'ERRORS', 14, 22, 20, '#ff6b6b', 800);
	ctx.strokeStyle = '#ff3b3b';
	ctx.lineWidth = 4;
	ctx.beginPath();
	for (let i = 0; i < 20; i++) {
		const y = H * 0.85 - (i / 20) * H * 0.6 - hash(seed + i) * 20;
		if (i === 0) ctx.moveTo(10 + (i / 19) * (W - 20), y);
		else ctx.lineTo(10 + (i / 19) * (W - 20), y);
	}
	ctx.stroke();
};

// ---- handwritten cash-only sign and offline terminal ----
export const cashSign = (ctx: C, W: number, H: number) => {
	ctx.fillStyle = '#fbf6e4';
	ctx.fillRect(0, 0, W, H);
	ctx.fillStyle = '#c0161f';
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.font = 'italic 700 92px "Marker Felt", "Comic Sans MS", cursive';
	ctx.fillText('CASH', W / 2, H * 0.3);
	ctx.fillText('ONLY', W / 2, H * 0.62);
	ctx.font = 'italic 600 34px "Marker Felt", "Comic Sans MS", cursive';
	ctx.fillStyle = '#222';
	ctx.fillText('cards not working, sorry!', W / 2, H * 0.88);
};
export const cardOffline = (ctx: C, W: number, H: number) => {
	ctx.fillStyle = '#2b2b2b';
	ctx.fillRect(0, 0, W, H);
	text(ctx, 'CARD', W / 2, H * 0.4, 40, '#888', 800, 'center');
	text(ctx, 'OFFLINE', W / 2, H * 0.55, 40, '#888', 800, 'center');
};

// ---- handwritten boarding pass ----
export const handPass = (ctx: C, W: number, H: number) => {
	ctx.fillStyle = '#fffdf6';
	ctx.fillRect(0, 0, W, H);
	ctx.strokeStyle = '#2b4c7e';
	ctx.lineWidth = 3;
	ctx.strokeRect(8, 8, W - 16, H - 16);
	ctx.fillStyle = '#1a2a6c';
	ctx.textAlign = 'left';
	ctx.textBaseline = 'middle';
	ctx.font = 'italic 600 30px "Bradley Hand", "Marker Felt", cursive';
	ctx.fillText('BOARDING PASS', 24, 40);
	ctx.font = 'italic 500 26px "Bradley Hand", "Marker Felt", cursive';
	ctx.fillText('SFO → SEA   gate 12', 24, 90);
	ctx.fillText('seat: 14C (any)', 24, 130);
	ctx.fillText('— no scan needed —', 24, 170);
};

// ---- local AI tutor on the students' laptops (offline model, checked by a mentor) ----
export const tutorScreen = (f: number) => (ctx: C, W: number, H: number) => {
	ctx.fillStyle = '#f7f7f8';
	ctx.fillRect(0, 0, W, H);
	ctx.fillStyle = '#e6f0ea';
	ctx.fillRect(0, 0, W, 26);
	text(ctx, 'Local AI tutor · offline', 10, 13, 13, '#1f5136', 700);
	rr(ctx, W * 0.3, 34, W * 0.66, 24, 8, '#5b5bd6');
	text(ctx, 'how does checkout reach the bank?', W * 0.32, 46, 11, '#fff', 600);
	if (f > 10) {
		const boxes = ['checkout', 'payments-api', 'bank'];
		boxes.forEach((b, i) => {
			const x = 10 + i * (W / 3.1);
			rr(ctx, x, 70, W / 3.6, 26, 6, i === 1 ? '#fde8e8' : '#ffffff');
			ctx.strokeStyle = '#999';
			ctx.lineWidth = 1.5;
			ctx.strokeRect(x, 70, W / 3.6, 26);
			text(ctx, b, x + W / 7.2, 83, 11, '#222', 700, 'center');
		});
	}
	if (f > 22) text(ctx, 'It failed here: expired certificate.', 12, 112, 12, '#b42318', 700);
	if (f > 34) text(ctx, 'Step 1: check the expiry date…', 12, 132, 12, '#333', 600);
	if (f > 48) {
		rr(ctx, 10, H - 34, W - 20, 26, 8, '#e3f5e7');
		text(ctx, '✓ Mentor reviewed: looks right', 20, H - 21, 12, '#1f7a3a', 700);
	}
};
