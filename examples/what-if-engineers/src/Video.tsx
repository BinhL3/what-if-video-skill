import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {BridgeAfter, BridgeCrash} from './scenes/bridge';
import {Fire} from './scenes/fire';
import {Rent} from './scenes/rent';
import {
	Airport,
	CashOnly,
	Government,
	Interview,
	Mentors,
	NewsStocks,
	OfficeAI,
	OfficeRestored,
	OfficeRunning,
	OfficeUnread,
	Rebuild,
	StorePayment,
	StorePhone,
} from './scenes/indoor';
import {clamp, ramp} from './lib';

const SERIF = '"Times New Roman", Georgia, serif';

// Beat layout in the v3 frame numbering; the v4 cut maps onto it through SEGMENTS below.
const WorldV3: React.FC<{f: number}> = ({f}) => {
	if (f < 150) return <BridgeCrash f={f} />;
	if (f < 265) return <BridgeCrash f={f - 60} />;
	if (f < 320) return <OfficeRunning f={f - 265} />;
	if (f < 485) return <OfficeUnread f={f - 320} />;
	if (f < 660) return <StorePayment f={f - 485} />;
	if (f < 810) return <StorePhone f={f - 660} />;
	if (f < 930) return <NewsStocks f={f - 810} />;
	if (f < 1020) return <Airport f={f - 930} />;
	if (f < 1110) return <CashOnly f={f - 1020} />;
	if (f < 1275) return <OfficeAI f={f - 1110} />;
	if (f < 1395) return <Government f={f - 1275} />;
	if (f < 1590) return <Rebuild f={f - 1395} />;
	if (f < 1650) return <BridgeAfter f={f - 1590} />;
	return <OfficeRestored f={f - 1650} />;
};

type Stat = [string, string];
const statsV3 = (f: number): Stat[] => {
	if (f < 150) return [['San Francisco', '8:00 AM'], ['Elapsed', '+0 SECONDS']];
	if (f < 320) return f < 265 ? [['Elapsed', '+5 SECONDS'], ['Software', 'STILL RUNNING']] : [['Elapsed', '+5 SECONDS'], ['Oversight', 'NONE']];
	if (f < 485) {
		const l = f - 320;
		const n = l < 25 ? '3' : l < 50 ? '12' : l < 75 ? '47' : '99+';
		return l < 55 ? [['Elapsed', '+1 HOUR'], ['Inbox', n]] : [['Elapsed', '+1 HOUR'], ['On-call', 'NO ANSWER']];
	}
	if (f < 660) return [['Elapsed', '+6 HOURS'], ['Service', f >= 547 ? 'PAYMENT ERROR' : 'RETRYING']];
	if (f < 810) return f < 725 ? [['Elapsed', '+24 HOURS'], ['Apps', 'UNAVAILABLE']] : [['Elapsed', '+24 HOURS'], ['Cloud', 'MAJOR OUTAGE']];
	if (f < 930) return [['Elapsed', '+2 DAYS'], ['Tech stocks', '▼ 38%']];
	if (f < 1110) return [['Elapsed', '+3 DAYS'], ['Recovery', f < 1020 ? 'HANDWRITTEN' : 'CASH ONLY']];
	if (f < 1275) return [['Elapsed', '+1 WEEK'], f < 1192 ? ['Cloud AI', 'DOWN'] : ['Local AI fix', 'ERRORS ▲ 58%']];
	if (f < 1395) return [['Elapsed', '+2 WEEKS'], ['Response', 'HIRING STUDENTS']];
	if (f < 1590) return [['Elapsed', '+1 MONTH'], ['Response', 'REBUILDING']];
	if (f < 1650) return [['San Francisco', '8:00 AM'], ['Elapsed', '+5 YEARS']];
	return [['Elapsed', '+5 YEARS'], ['Status', 'BACK TO NORMAL']];
};

const CAPTIONS: [number, number, string][] = [
	[-200, 148, 'What if every software engineer disappeared?'],
	[212, 264, 'Self-driving cars keep running… for now.'],
	[266, 319, 'No engineers are left to catch the next bug.'],
	[325, 415, 'The outage pages the on-call engineer.'],
	[415, 483, 'Nobody is left to answer.'],
	[547, 566, 'Payment failed.'],
	[566, 611, 'An expired certificate blocks payments.'],
	[611, 658, 'Ops can’t patch this one. The on-call team is gone.'],
	[667, 722, 'Nothing loads.'],
	[722, 808, 'Outages spread. Repairs fall behind.'],
	[815, 928, 'Tech stocks crash.'],
	[935, 1018, 'Airlines handwrite boarding passes.'],
	[1022, 1108, 'Stores switch to cash only.'],
	[1116, 1190, 'Cloud AI is down too. Someone runs a local model.'],
	[1190, 1273, 'The attempted fix makes things worse.'],
	[1280, 1392, 'Governments call on college coders.'],
	[1400, 1586, 'College coders start rebuilding.'],
	[1594, 1652, 'Five years later.'],
	[1652, 1801, 'Five years later. A new generation of engineers.'],
];

// [v3 start, v3 end, v4 start, v4 end]. The interview (150–270) and mentors (1330–1435) are new-only beats.
const SEGMENTS: [number, number, number, number][] = [
	[0, 150, 0, 150],
	[210, 265, 270, 320],
	[265, 320, 320, 370],
	[320, 485, 370, 520],
	[485, 660, 520, 675],
	[660, 810, 675, 810],
	[810, 930, 810, 915],
	[930, 1020, 915, 995],
	[1020, 1110, 995, 1075],
	[1110, 1275, 1075, 1225],
	[1275, 1395, 1225, 1330],
	[1395, 1590, 1435, 1590],
	[1590, 1650, 1590, 1640],
	[1650, 1800, 1640, 1800],
];
const INTERVIEW: [number, number] = [150, 270];
const MENTORS: [number, number] = [1330, 1435];
const within = (g: number, r: [number, number]) => g >= r[0] && g < r[1];
const toV3 = (g: number) => {
	const s = SEGMENTS.find(([, , a, b]) => g >= a && g < b) ?? SEGMENTS[SEGMENTS.length - 1];
	return s[0] + ((g - s[2]) * (s[1] - s[0])) / (s[3] - s[2]);
};

const WorldV4: React.FC<{f: number}> = ({f}) => {
	if (within(f, INTERVIEW)) return <Interview f={f - INTERVIEW[0]} />;
	if (within(f, MENTORS)) return <Mentors f={f - MENTORS[0]} />;
	return <WorldV3 f={toV3(f)} />;
};

const stats = (g: number): Stat[] => {
	if (within(g, INTERVIEW)) return [['Meanwhile', 'TECH INTERVIEW'], ['Elapsed', '+0 SECONDS']];
	if (within(g, MENTORS)) return [['Elapsed', '+3 WEEKS'], ['Response', 'RETIREES + AI']];
	return statsV3(toV3(g));
};

// Caption and the frame clock its fade runs on.
const caption = (g: number): {t: number; cap?: [number, number, string]} => {
	if (within(g, INTERVIEW)) return {t: g, cap: [192, 268, 'Mid-interview, the interviewer vanishes.']};
	if (within(g, MENTORS)) return {t: g, cap: [1336, 1433, 'Former engineers teach. Local AI helps students catch up.']};
	const t = toV3(g);
	return {t, cap: CAPTIONS.find(([a, b]) => t >= a && t < b)};
};

const CHYRONS: [number, number, string, string][] = [
	[825, 928, 'TECH STOCKS IN FREEFALL', 'No engineers to keep products running · markets halt trading twice'],
	[1285, 1393, 'GOVERNMENTS LAUNCH EMERGENCY CODER DRIVE', 'Student coders urged to apply · fast-track jobs and training'],
];

const Chyron: React.FC<{f: number}> = ({f}) => {
	const c = CHYRONS.find(([a, b]) => f >= a && f < b);
	if (!c) return null;
	const k = ramp(f, c[0], c[0] + 8);
	return (
		<div style={{position: 'absolute', left: 0, right: 0, top: 1500, transform: `translateX(${(1 - k) * -1100}px)`, fontFamily: 'Helvetica, Arial, sans-serif'}}>
			<div style={{display: 'flex', height: 74}}>
				<div style={{background: '#c81e1e', color: '#fff', fontWeight: 900, fontSize: 30, padding: '0 22px', display: 'flex', alignItems: 'center'}}>BREAKING</div>
				<div style={{flex: 1, background: '#f4f4f4', color: '#111', fontWeight: 800, fontSize: 31, padding: '0 18px', display: 'flex', alignItems: 'center'}}>{c[2]}</div>
			</div>
			<div style={{background: '#1b1f2a', color: '#e8e8e8', fontSize: 24, fontWeight: 600, height: 44, display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', overflow: 'hidden'}}>
				<span style={{transform: `translateX(${200 - (f - c[0]) * 5}px)`}}>{c[3]}</span>
			</div>
		</div>
	);
};

const shadow = '0 2px 0 rgba(0,0,0,0.55), 0 0 18px rgba(0,0,0,0.55)';
// thin dark outline drawn under the fill so letters stay crisp on bright backgrounds
const stroke = {WebkitTextStroke: '2px rgba(0,0,0,0.55)', paintOrder: 'stroke fill'} as const;

type Override = {st: Stat[]; t: number; cap?: [number, number, string]; noChyron?: boolean};

const Overlay: React.FC<{f: number; over?: Override}> = ({f, over}) => {
	const st = over ? over.st : stats(f);
	const {t, cap} = over ?? caption(f);
	const capOpacity = cap ? clamp(ramp(t, cap[0], cap[0] + 5) * (1 - ramp(t, cap[1] - 4, cap[1]))) : 0;
	const flashAt = f < 100 ? 14 : 190;
	const flash = f >= flashAt && f < flashAt + 4 ? 0.35 * (1 - (f - flashAt) / 4) : 0;
	return (
		<AbsoluteFill style={{pointerEvents: 'none'}}>
			<AbsoluteFill style={{background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,0.38) 100%)'}} />
			<AbsoluteFill style={{background: '#fff', opacity: flash}} />
			<AbsoluteFill style={{background: 'radial-gradient(ellipse 620px 360px at 160px 330px, rgba(0,0,0,0.45), rgba(0,0,0,0) 70%)'}} />
			<div style={{position: 'absolute', left: 70, top: 230, fontFamily: SERIF, color: '#fff', textShadow: shadow, ...stroke}}>
				{st.map(([label, value]) => (
					<div key={label} style={{marginBottom: 28}}>
						<div style={{fontSize: 30, letterSpacing: 4, textTransform: 'uppercase', opacity: 0.88}}>{label}</div>
						<div style={{fontSize: 58, lineHeight: 1.05}}>{value}</div>
					</div>
				))}
			</div>
			{cap ? (
				<div
					style={{
						position: 'absolute',
						left: 90,
						right: 90,
						top: 1300,
						textAlign: 'center',
						fontFamily: SERIF,
						fontStyle: 'italic',
						fontSize: 66,
						lineHeight: 1.18,
						color: '#fff',
						textShadow: shadow,
						...stroke,
						opacity: capOpacity,
					}}
				>
					{cap[2]}
				</div>
			) : null}
			<Chyron f={over?.noChyron || within(f, INTERVIEW) || within(f, MENTORS) ? -1 : toV3(f)} />

		</AbsoluteFill>
	);
};

// v5 cut: a 5-second countdown before the vanish, and the apartment fire before the stock crash.
const COUNTDOWN = 106; // frames before v4 frame 0; 5 numbers x 24 frames, the vanish (v4 frame 14) lands on zero
const FIRE: [number, number] = [COUNTDOWN + 810, COUNTDOWN + 960];
const RENT_AT = 1075; // v4 frame where the AI beat starts; the rent beat goes right before it
const RENT: [number, number] = [COUNTDOWN + 150 + RENT_AT, COUNTDOWN + 150 + RENT_AT + 150];
const toV4 = (g: number) => (g < FIRE[0] ? g - COUNTDOWN : g < RENT[0] ? g - COUNTDOWN - 150 : g - COUNTDOWN - 300);

const World: React.FC<{g: number}> = ({g}) => {
	if (g < COUNTDOWN) return <BridgeCrash f={g - COUNTDOWN} />;
	if (within(g, FIRE)) return <Fire f={g - FIRE[0]} />;
	if (within(g, RENT)) return <Rent f={g - RENT[0]} />;
	return <WorldV4 f={toV4(g)} />;
};

const overrideFor = (g: number): Override | undefined => {
	if (g < COUNTDOWN + 14) return {st: [['San Francisco', '7:59 AM']], t: g, cap: [-10, 10000, 'What if every software engineer disappeared?'], noChyron: true};
	if (within(g, RENT)) {
		return {st: [['Elapsed', '+5 DAYS'], ['Marina rent', g - RENT[0] < 115 ? 'FALLING' : '▼ 55%']], t: g, cap: [RENT[0] + 4, RENT[1] - 2, 'SF rent finally drops.'], noChyron: true};
	}
	if (within(g, FIRE)) {
		return {
			st: [['Elapsed', '+36 HOURS'], g - FIRE[0] < 38 ? ['911 call', 'APARTMENT FIRE'] : ['Dispatch', g - FIRE[0] < 75 ? 'FROZEN' : 'BY HAND']],
			t: g,
			cap: [FIRE[0] + 6, FIRE[1] - 2, 'A fire breaks out. Dispatchers route crews by hand.'],
			noChyron: true,
		};
	}
	return undefined;
};

const Countdown: React.FC<{g: number}> = ({g}) => {
	const end = COUNTDOWN + 14;
	if (g >= end + 6) return null;
	const n = Math.max(0, Math.ceil((end - g) / 24));
	const inSec = ((end - g) % 24) / 24;
	const pop = g < end ? 1 + 0.25 * Math.max(0, inSec - 0.75) * 4 : 1;
	const fadeOut = g >= end ? 1 - (g - end) / 6 : 1;
	return (
		<AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', pointerEvents: 'none', opacity: fadeOut}}>
			<div style={{position: 'absolute', top: 640, left: 60, right: 60, textAlign: 'center', fontFamily: '"Times New Roman", Georgia, serif', color: '#fff', textShadow: '0 2px 0 rgba(0,0,0,0.6), 0 0 22px rgba(0,0,0,0.6)', WebkitTextStroke: '2px rgba(0,0,0,0.55)', paintOrder: 'stroke fill'}}>
				<div style={{fontSize: 44, letterSpacing: 6, textTransform: 'uppercase'}}>Every software engineer</div>
				<div style={{fontSize: 44, letterSpacing: 6, textTransform: 'uppercase'}}>disappears in</div>
				<div style={{fontSize: 260, lineHeight: 1.1, transform: `scale(${pop})`, color: n === 0 ? '#ffdddd' : '#fff'}}>{n}</div>
			</div>
		</AbsoluteFill>
	);
};

export const Video: React.FC = () => {
	const g = useCurrentFrame();
	const f = toV4(g);
	const {width, height, durationInFrames} = useVideoConfig();
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<ThreeCanvas
				width={width}
				height={height}
				dpr={0.5}
				flat
				gl={{antialias: false, preserveDrawingBuffer: true}}
				style={{imageRendering: 'pixelated'}}
			>
				<World g={g} />
			</ThreeCanvas>
			<Overlay f={f} over={overrideFor(g)} />
			<Countdown g={g} />
			<AbsoluteFill style={{background: '#000', opacity: ramp(g, durationInFrames - 24, durationInFrames - 2)}} />
			<Audio src={staticFile('soundtrack.wav')} />
		</AbsoluteFill>
	);
};
