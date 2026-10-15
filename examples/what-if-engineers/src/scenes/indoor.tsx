import React from 'react';
import * as THREE from 'three';
import {B, Burst, Cam, Cyl, Draw, Env, Lights, Screen, useStaticTexture} from '../three/core';
import {Chair, Desk, Laptop, Monitor, Person, PersonProps, PhoneRig} from '../three/prims';
import {
	aiScreen,
	briefingScreen,
	cardOffline,
	cashSign,
	chatScreen,
	codeScreen,
	departures,
	handPass,
	interviewLaptop,
	whiteboard,
	pagerScreen,
	redScreen,
	stocksScreen,
	tutorScreen,
	laptopScreen,
	phoneBank,
	phoneChat,
	phoneMap,
	restoredScreen,
	skyline,
	terminalScreen,
} from '../screens';
import {hash, lerp, lerp3, ramp, smooth, V3} from '../lib';

// Recurring characters
export const MAYA: PersonProps = {shirt: '#d9a21b', pants: '#33415c', hair: '#1b1411', hairStyle: 'long', skin: '#c58c66'};
export const SAM: PersonProps = {shirt: '#1f8a83', pants: '#3a3a3a', hair: '#2d2018', hairStyle: 'cap', skin: '#8d5a3f'};
const DANA: PersonProps = {shirt: '#6d7178', pants: '#2a2c33', hair: '#6b4a2c', hairStyle: 'bun', skin: '#e1b595'};

// ---------- OFFICE ----------
type Mode = 'day' | 'dusk' | 'restored';
const COLS = [-4.2, 0, 4.2];
const ROWS = [-6.4, -3.2, 0];
const STAFF: PersonProps[] = [
	{shirt: '#2e86ab', hair: '#2a1d16', skin: '#c99a78'},
	{shirt: '#c0392b', hair: '#3b2a1d', hairStyle: 'long', skin: '#e0b79a'},
	{shirt: '#7b61ff', hair: '#111', skin: '#d9a982'},
	{shirt: '#e05a47', hair: '#3b2a1d', hairStyle: 'bun', skin: '#f0c8a8'},
	{shirt: '#3c6e8f', hair: '#222', hairStyle: 'cap', skin: '#a8714f'},
	{shirt: '#556b2f', hair: '#5b3a22', skin: '#e0b79a'},
	{shirt: '#9b59b6', hair: '#141414', hairStyle: 'long', skin: '#7a4b33'},
	{shirt: '#e6a157', hair: '#2a1d16', skin: '#d4a684'},
	SAM,
];

const Window: React.FC<{mode: 'day' | 'dusk'}> = ({mode}) => {
	const tex = useStaticTexture(1024, 160, skyline(mode), `sky-${mode}`);
	return (
		<mesh position={[0, 1.7, -9.98]}>
			<planeGeometry args={[22, 2.6]} />
			<meshBasicMaterial map={tex} toneMapped={false} fog={false} />
		</mesh>
	);
};

const codeDraws = Array.from({length: 9}, (_, i) => codeScreen(i + 1));

export const OfficeSet: React.FC<{
	mode: Mode;
	hero: Draw;
	occupied?: boolean;
	heroSitter?: PersonProps | null;
	others?: Draw[];
	pager?: {draw: Draw; buzz: number};
	children?: React.ReactNode;
}> = ({mode, hero, occupied, heroSitter, others, pager, children}) => {
	const dusk = mode === 'dusk';
	const wall = dusk ? '#8a7f8c' : '#dedbd4';
	return (
		<>
			{dusk ? (
				<>
					<Env bg="#2a2238" fog={['#33283f', 6, 32]} />
					<Lights sky="#8a7aa8" ground="#3a2a2a" hemi={0.9} sun="#ff9a5a" sunI={1.6} sunP={[2, 4, -20]} amb={0.15} />
				</>
			) : (
				<>
					<Env bg="#d8dde0" fog={['#dfe2e2', 10, 45]} />
					<Lights sky="#f6f6f2" ground="#7a746c" hemi={mode === 'restored' ? 1.7 : 1.5} sun={mode === 'restored' ? '#ffe2b0' : '#fff6e8'} sunI={1.1} sunP={[3, 6, -20]} />
				</>
			)}
			<B p={[0, -0.05, -2.5]} s={[24, 0.1, 16]} c={dusk ? '#4a4b55' : '#7d8288'} />
			<B p={[0, 1.65, -10.05]} s={[24, 3.5, 0.1]} c={wall} />
			<Window mode={dusk ? 'dusk' : 'day'} />
			<B p={[-12, 1.65, -2.5]} s={[0.1, 3.5, 16]} c={wall} />
			<B p={[12, 1.65, -2.5]} s={[0.1, 3.5, 16]} c={wall} />
			<B p={[0, 3.4, -2.5]} s={[24, 0.1, 16]} c={dusk ? '#5d5866' : '#ecebe6'} />
			{[-6, -2, 2].map((z) =>
				[-4.2, 0, 4.2].map((x) => <B key={`${x}${z}`} p={[x, 3.33, z]} s={[1.4, 0.04, 0.5]} c="#fffaf0" basic />),
			)}
			{[-8, 8].map((x) => (
				<B key={x} p={[x, 1.65, -4]} s={[0.6, 3.5, 0.6]} c={wall} />
			))}
			{[
				[-9.5, -8.5],
				[9.5, -8.5],
				[-9.5, 1.5],
			].map(([x, z], i) => (
				<group key={i} position={[x, 0, z]}>
					<Cyl p={[0, 0.25, 0]} rt={0.28} rb={0.22} h={0.5} c="#d8d2c6" />
					<mesh position={[0, 1.0, 0]}>
						<coneGeometry args={[0.45, 1.2, 6]} />
						<meshLambertMaterial color="#4e7a43" flatShading />
					</mesh>
				</group>
			))}
			{COLS.map((x, ci) =>
				ROWS.map((z, ri) => {
					const i = ri * 3 + ci;
					const isHero = x === 0 && z === 0;
					const sitter = isHero ? heroSitter : occupied ? STAFF[i] : null;
					return (
						<group key={i}>
							<Desk p={[x, 0, z]} />
							<Monitor p={[x, 1.1, z - 0.22]} draw={isHero ? hero : (others ?? codeDraws)[i]} res={isHero ? 640 : 256} />
							<Chair p={[x, 0, z + 0.62]} yaw={Math.PI} />
							{sitter ? <Person {...sitter} p={[x, 0, z + 0.62]} yaw={Math.PI} pose="sit" arms="type" /> : null}
							{occupied ? <Laptop p={[x + 0.5, 0.755, z + 0.05]} yaw={0.3} open={0} /> : null}
						</group>
					);
				}),
			)}
			{pager ? (
				<group position={[-0.5 + pager.buzz * 0.004, 0.8, 0.12]} rotation={[-1.15, 0.25 + pager.buzz * 0.03, 0]}>
					<B p={[0, 0, -0.006]} s={[0.085, 0.165, 0.01]} c="#121316" />
					<Screen p={[0, 0, 0.0]} w={0.077} h={0.155} res={300} draw={pager.draw} />
				</group>
			) : null}
			{children}
		</>
	);
};

// ---------- INTERVIEW ROOM: the interviewer vanishes mid-question ----------
const INTERVIEWER: PersonProps = {shirt: '#3b5b92', pants: '#2a2c33', hair: '#4a3020', skin: '#d9a982'};

export const Interview: React.FC<{f: number}> = ({f}) => {
	const vanish = 40;
	const gone = f >= vanish || (f >= vanish - 4 && f % 2 === 1);
	const shocked = f >= vanish + 4;
	const room = (
		<>
			<Env bg="#e9e6df" fog={['#e9e6df', 6, 22]} />
			<Lights sky="#ffffff" ground="#857c70" hemi={1.6} sun="#fff1dc" sunI={0.9} sunP={[4, 6, 5]} />
			<B p={[0, -0.05, 0]} s={[7, 0.1, 7]} c="#8d8a84" />
			<B p={[0, 1.5, -2.1]} s={[7, 3.1, 0.1]} c="#e4e1da" />
			<B p={[-3, 1.5, 0]} s={[0.1, 3.1, 7]} c="#d9d6cf" />
			<mesh position={[3, 1.5, 0]}>
				<boxGeometry args={[0.05, 3.1, 7]} />
				<meshLambertMaterial color="#cfe3ee" transparent opacity={0.35} depthWrite={false} />
			</mesh>
			<B p={[0, 1.55, -2.04]} s={[2.5, 1.25, 0.03]} c="#9aa0a6" />
			<Screen p={[0, 1.55, -2.02]} w={2.4} h={1.15} res={800} draw={whiteboard} />
			<B p={[0, 0.73, 0]} s={[1.6, 0.05, 0.9]} c="#e8e4dc" />
			<Cyl p={[0, 0.36, 0]} rt={0.06} h={0.7} c="#5f6368" />
			<Chair p={[0, 0, -0.75]} yaw={0} />
			<Chair p={[0, 0, 0.75]} yaw={Math.PI} />
			<Laptop p={[0.05, 0.755, -0.3]} yaw={Math.PI} open={1} draw={interviewLaptop} />
			<B p={[-0.45, 0.76, 0.2]} s={[0.21, 0.004, 0.29]} c="#fbfaf6" r={[0, 0.2, 0]} />
			<Cyl p={[0.5, 0.81, -0.25]} rt={0.04} h={0.11} c="#ffffff" />
			{gone ? null : <Person {...INTERVIEWER} p={[0, 0, -0.75]} pose="sit" arms="hold" headPitch={0.05 + Math.sin(f * 0.3) * 0.04} headYaw={Math.sin(f * 0.11) * 0.12} />}
			<Burst p={[0, 1.15, -0.75]} f={f} start={vanish} len={14} color="#ffffff" n={22} spread={0.6} size={0.05} />
			<Person
				{...SAM}
				p={[0, 0, 0.75]}
				yaw={Math.PI}
				pose="sit"
				arms={f >= 95 ? 'wave' : shocked ? 'shrug' : 'type'}
				armBlend={f >= 95 ? smooth(ramp(f, 95, 102)) : shocked ? smooth(ramp(f, vanish + 4, vanish + 10)) : 1}
				headPitch={shocked ? -0.12 : 0.1}
				headYaw={f >= 75 && f < 95 ? Math.sin((f - 75) * 0.16) * 0.6 : 0}
			/>
		</>
	);
	if (f < 70) {
		// over the candidate's shoulder: the interviewer is mid-question, then gone
		return (
			<>
				{room}
				<Cam p={lerp3([0.45, 1.4, 1.75], [0.4, 1.36, 1.5], ramp(f, 0, 70))} t={[0, 1.1, -0.75]} fov={46} />
			</>
		);
	}
	// reverse: the candidate stares at the empty chair, looks around, tries a wave
	return (
		<>
			{room}
			<Cam p={lerp3([-0.4, 1.32, -1.95], [-0.35, 1.3, -1.8], ramp(f, 70, 120))} t={[0, 1.12, 0.75]} fov={48} />
		</>
	);
};

// 265–319: empty office, monitors still on
export const OfficeRunning: React.FC<{f: number}> = ({f}) => {
	const u = smooth(ramp(f, 0, 55));
	return (
		<OfficeSet mode="day" hero={codeScreen(42)}>
			<Cam p={[lerp(-3.4, -1.8, u), 1.55, 3.6]} t={[0.3, 1.0, -3]} fov={55} />
		</OfficeSet>
	);
};

const unread = (f: number) => (f < 25 ? 3 : f < 50 ? 12 : f < 75 ? 47 : 99);

// 320–484: the outage pages the on-call engineer; nobody answers
export const OfficeUnread: React.FC<{f: number}> = ({f}) => {
	const ring = ramp(f, 95, 100);
	const draw = chatScreen({count: unread(f), f, ring: f >= 95 ? ring : 0});
	const buzz = f % 16 < 8 ? Math.sin(f * 2.3) : 0;
	const pager = {draw: pagerScreen(f), buzz};
	if (f < 55) {
		return (
			<OfficeSet mode="day" hero={draw} pager={pager}>
				<Person {...DANA} p={[-2.3, 0, -1.7]} yaw={0.55} arms="phone" headYaw={Math.sin(f * 0.04) * 0.25} />
				<Cam p={lerp3([0.9, 1.45, 2.7], [0.7, 1.4, 2.4], ramp(f, 0, 55))} t={[-0.1, 1.0, -0.3]} fov={55} />
			</OfficeSet>
		);
	}
	if (f < 95) {
		// close on the abandoned phone buzzing with the page
		return (
			<OfficeSet mode="day" hero={draw} pager={pager}>
				<Cam p={lerp3([-0.38, 1.12, 0.42], [-0.4, 1.1, 0.38], ramp(f, 55, 95))} t={[-0.5, 0.79, 0.07]} fov={40} />
			</OfficeSet>
		);
	}
	return (
		<OfficeSet mode="day" hero={draw} pager={pager}>
			<Person {...DANA} p={[-2.3, 0, -1.7]} yaw={0.55} arms="phone" headYaw={Math.sin(f * 0.04) * 0.25} />
			<Cam p={lerp3([0.2, 1.42, 1.75], [0.15, 1.38, 1.55], ramp(f, 95, 165))} t={[0.1, 1.0, -0.2]} fov={40} />
		</OfficeSet>
	);
};

// ---------- STORE ----------
const Shelves: React.FC = () => {
	const items = [];
	for (let i = 0; i < 70; i++) {
		const col = i % 14;
		const row = Math.floor(i / 14);
		const c = ['#e94f37', '#f6c445', '#3f88c5', '#44bba4', '#f2f2f2', '#8e5572', '#ff8c42'][Math.floor(hash(i) * 7)];
		items.push(<B key={i} p={[-4.2 + col * 0.6, 0.55 + row * 0.42, -3.7]} s={[0.45, 0.3 + hash(i + 3) * 0.08, 0.3]} c={c} />);
	}
	return (
		<>
			<B p={[0, 1.2, -3.95]} s={[9, 2.6, 0.2]} c="#cfc7b8" />
			{[0, 1, 2, 3, 4].map((r) => (
				<B key={r} p={[0, 0.38 + r * 0.42, -3.7]} s={[9, 0.04, 0.5]} c="#a89f90" />
			))}
			{items}
		</>
	);
};

const QUEUE: PersonProps[] = [
	{shirt: '#3d5a80', hair: '#2a2a2a', skin: '#b5835a'},
	{shirt: '#98c1d9', hair: '#5b3a22', hairStyle: 'bun', skin: '#f0c8a8'},
	{shirt: '#293241', hair: '#141414', hairStyle: 'cap', skin: '#8d5a3f'},
	{shirt: '#ee6c4d', hair: '#3a2a20', skin: '#d4a684'},
];
const CUSTOMER: PersonProps = {shirt: '#b7413a', pants: '#2f2f35', hair: '#2d1e16', hairStyle: 'long', skin: '#d6a07c'};

export const StoreSet: React.FC<{
	terminal: Draw;
	cashierArms?: PersonProps['arms'];
	customerArms?: PersonProps['arms'];
	customerHold?: React.ReactNode;
	queueLen?: number;
	hideQueue1?: boolean;
	children?: React.ReactNode;
}> = ({terminal, cashierArms = 'down', customerArms = 'card', customerHold, queueLen = 2, hideQueue1, children}) => (
	<>
		<Env bg="#efe9dd" fog={['#efe9dd', 8, 30]} />
		<Lights sky="#fffaf0" ground="#8a7d6a" hemi={1.6} sun="#fff1d6" sunI={0.9} sunP={[3, 8, 6]} />
		<B p={[0, -0.05, 0]} s={[14, 0.1, 16]} c="#d9d2c4" />
		<B p={[0, 3.2, 0]} s={[14, 0.1, 16]} c="#f2efe8" />
		{[-2, 1, 4].map((z) => (
			<B key={z} p={[0, 3.12, z]} s={[3, 0.04, 0.4]} c="#fffaf0" basic />
		))}
		<Shelves />
		<B p={[-5, 1.6, -1]} s={[0.1, 3.2, 10]} c="#e2dccf" />
		{/* counter */}
		<B p={[0, 0.5, 0]} s={[3, 1.0, 0.6]} c="#5a6b7a" />
		<B p={[0, 1.02, 0]} s={[3.1, 0.05, 0.7]} c="#e8e2d6" />
		<B p={[-0.9, 1.2, -0.05]} s={[0.4, 0.3, 0.35]} c="#2b2d31" />
		{/* card terminal */}
		<group position={[0.3, 1.05, 0.18]}>
			<B p={[0, 0.05, 0]} s={[0.1, 0.1, 0.1]} c="#222" />
			<group position={[0, 0.2, 0]} rotation={[-0.45, 0, 0]}>
				<B p={[0, 0, -0.03]} s={[0.24, 0.34, 0.05]} c="#1a1b1e" />
				<Screen p={[0, 0.025, -0.003]} w={0.2} h={0.26} res={360} draw={terminal} />
			</group>
		</group>
		<Person shirt="#3e7c4a" pants="#2a2c33" hair="#2a1d16" hairStyle="cap" skin="#b98563" p={[0.1, 0, -0.75]} arms={cashierArms} />
		<Person {...CUSTOMER} p={[0.62, 0, 0.82]} yaw={Math.PI + 0.25} arms={customerArms} hold={customerHold ?? (customerArms === 'card' ? <B s={[0.085, 0.006, 0.055]} c="#d4af37" /> : undefined)} />
		{QUEUE.slice(0, queueLen).map((q, i) =>
			hideQueue1 && i === 1 ? null : (
				<Person key={i} {...q} p={[0.75 + (i % 2) * 0.2, 0, 1.75 + i * 0.85]} yaw={Math.PI + (i % 2 ? -0.2 : 0.15)} arms={i === 1 ? 'hold' : 'down'} headYaw={i % 2 ? 0.3 : -0.2} />
			),
		)}
		{children}
	</>
);

// 485–659: payment retries then fails
export const StorePayment: React.FC<{f: number}> = ({f}) => {
	const state = f < 25 ? 'processing' : f < 62 ? 'retry' : 'failed';
	const draw = terminalScreen(state, f, f < 42 ? 1 : 2);
	if (f < 100) {
		return (
			<StoreSet terminal={draw}>
				<Cam p={lerp3([0.34, 1.52, 0.92], [0.32, 1.48, 0.82], ramp(f, 0, 100))} t={[0.3, 1.2, 0.12]} fov={46} />
			</StoreSet>
		);
	}
	return (
		<StoreSet terminal={draw} cashierArms="shrug" customerArms="down" queueLen={3}>
			<Cam p={lerp3([2.8, 1.75, 3.4], [2.5, 1.7, 3.0], ramp(f, 100, 175))} t={[0.2, 1.15, 0.5]} fov={52} />
		</StoreSet>
	);
};

// 660–809: phone apps fail one after another, then pull back to the stalled queue
export const StorePhone: React.FC<{f: number}> = ({f}) => {
	const failedTerminal = terminalScreen('failed', f);
	const taps = [12, 55, 98];
	const tap = taps.reduce((a, t) => Math.max(a, 1 - Math.abs(f - t) / 5), 0);
	let draw: Draw;
	if (f < 45) draw = phoneChat(f, f > 22);
	else if (f < 88) draw = phoneMap(f, f > 65);
	else draw = phoneBank(f, f > 108);
	const phonePos: V3 = [0.58, 1.18, 2.22];
	if (f < 125) {
		return (
			<StoreSet terminal={failedTerminal} customerArms="down" queueLen={4} hideQueue1>
				<PhoneRig p={phonePos} r={[-0.6, 0, 0]} draw={draw} tap={tap} sleeve="#98c1d9" skin="#f0c8a8" />
				<Cam p={[0.6, 1.4, 2.5]} t={[phonePos[0], phonePos[1] - 0.01, phonePos[2]]} fov={42} />
			</StoreSet>
		);
	}
	const u = smooth(ramp(f, 125, 150));
	return (
		<StoreSet terminal={failedTerminal} customerArms="down" queueLen={4}>
			<Cam p={lerp3([0.6, 1.4, 2.5], [3.4, 2.3, 6.4], u)} t={lerp3([0.58, 1.17, 2.22], [0.3, 1.1, 1.2], u)} fov={lerp(42, 55, u)} />
		</StoreSet>
	);
};

// ---------- NEWS STUDIO: tech stocks crash ----------
export const NewsStocks: React.FC<{f: number}> = ({f}) => (
	<>
		<Env bg="#0d1430" fog={['#0d1430', 8, 30]} />
		<Lights sky="#9fb4ff" ground="#2a2a3a" hemi={1.3} sun="#ffffff" sunI={1.0} sunP={[2, 5, 6]} />
		<B p={[0, -0.05, 0]} s={[14, 0.1, 12]} c="#1a2140" />
		<B p={[0, 2, -2]} s={[14, 4.2, 0.1]} c="#142047" />
		<B p={[0, 2.05, -1.93]} s={[4.5, 2.6, 0.06]} c="#05070f" />
		<Screen p={[0, 2.05, -1.89]} w={4.3} h={2.42} res={900} draw={stocksScreen(f)} />
		{[-3.2, 3.2].map((x) => (
			<B key={x} p={[x, 2, -1.9]} s={[0.12, 4, 0.12]} c="#3d5bd9" e="#3d5bd9" ei={0.6} />
		))}
		<B p={[0.2, 0.5, 0.35]} s={[2.4, 1.0, 0.7]} c="#2d3a6b" />
		<B p={[0.2, 1.02, 0.35]} s={[2.5, 0.05, 0.8]} c="#d9dde8" />
		<B p={[0.2, 0.55, 0.71]} s={[2.4, 0.08, 0.02]} c="#c81e1e" e="#c81e1e" ei={0.6} />
		<Person shirt="#3a3f4f" pants="#22252e" hair="#3b2a1d" hairStyle="bun" skin="#d4a684" p={[0.3, 0, -0.1]} arms="hold" hold={<B s={[0.21, 0.004, 0.29]} c="#fff" r={[1.2, 0, 0]} />} headYaw={Math.sin(f * 0.05) * 0.15} />
		<Cam p={lerp3([1.3, 1.65, 4.6], [1.0, 1.62, 4.0], ramp(f, 0, 135))} t={[-0.1, 1.75, -1]} fov={52} />
	</>
);

// ---------- AIRPORT ----------
const Suitcase: React.FC<{p: V3; c: string}> = ({p, c}) => (
	<group position={p}>
		<B p={[0, 0.33, 0]} s={[0.42, 0.6, 0.24]} c={c} />
		<B p={[0, 0.7, 0]} s={[0.2, 0.15, 0.03]} c="#222" />
	</group>
);

export const Airport: React.FC<{f: number}> = ({f}) => {
	const u = ramp(f, 0, 50);
	const close = f >= 50;
	const paperY = 1.092 + Math.max(0, Math.sin(f * 0.25)) * 0.01;
	return (
		<>
			<Env bg="#e7e4dd" fog={['#e7e4dd', 10, 40]} />
			<Lights sky="#ffffff" ground="#8b8577" hemi={1.6} sun="#fff4e2" sunI={0.8} sunP={[-4, 8, 6]} />
			<B p={[0, -0.05, 0]} s={[20, 0.1, 20]} c="#cfcac0" />
			<B p={[0, 2.4, -4]} s={[20, 5, 0.2]} c="#e8e6e0" />
			<B p={[0, 4.4, 0]} s={[20, 0.1, 20]} c="#f4f2ee" />
			<B p={[0, 3.05, -3.93]} s={[4.0, 2.1, 0.1]} c="#1a1c22" />
			<Screen p={[0, 3.05, -3.86]} w={3.8} h={1.9} res={900} draw={departures(f)} />
			{/* counter */}
			<B p={[0, 0.52, 0]} s={[6, 1.04, 0.7]} c="#4a5d75" />
			<B p={[0, 1.06, 0]} s={[6.1, 0.05, 0.8]} c="#ece8e0" />
			<B p={[0.9, 1.25, -0.1]} s={[0.5, 0.32, 0.04]} c="#141518" />
			<Screen p={[0.9, 1.25, -0.077]} w={0.46} h={0.28} res={256} draw={(ctx, W, H) => {
				ctx.fillStyle = '#1f2a44';
				ctx.fillRect(0, 0, W, H);
				ctx.fillStyle = '#ff5a4f';
				ctx.font = '700 34px Helvetica';
				ctx.textAlign = 'center';
				ctx.fillText('OFFLINE', W / 2, H / 2 + 10);
			}} />
			{[0, 1, 2, 3, 4, 5].map((i) => (
				<B key={i} p={[-0.9 + (i % 3) * 0.06, 1.09 + Math.floor(i / 3) * 0.008 + i * 0.004, 0.1 + (i % 2) * 0.03]} s={[0.21, 0.004, 0.29]} c="#fbfaf6" r={[0, i * 0.15, 0]} />
			))}
			<group position={[-0.5, paperY, 0.22]} rotation={[-Math.PI / 2, 0, close ? 0.08 : -0.2]}>
				<Screen w={0.3} h={0.15} res={420} draw={handPass} />
			</group>
			<Person shirt="#2b4c7e" pants="#222" hair="#2a1d16" hairStyle="bun" skin="#d4a684" p={[-0.6, 0, -0.7]} arms="write" headPitch={0.35} />
			<Person shirt="#2b4c7e" pants="#222" hair="#111" skin="#8d5a3f" p={[1.5, 0, -0.7]} arms="hold" hold={<B s={[0.21, 0.004, 0.29]} c="#fff" r={[1.2, 0, 0]} />} headPitch={0.25} />
			{close ? null : <Person shirt="#c8553d" pants="#2f2f35" hair="#3a2a20" skin="#e0b79a" p={[-0.5, 0, 0.85]} yaw={Math.PI} arms="card" />}
			<Suitcase p={[-1.0, 0, 1.0]} c="#2e86ab" />
			{[
				[0.4, 2.0, '#6a4c93', '#f2cfb3'],
				[-0.2, 2.9, '#1982c4', '#7a4b33'],
				[0.6, 3.8, '#8ac926', '#d4a684'],
				[-0.1, 4.7, '#ff595e', '#b5835a'],
			].map(([x, z, c, s], i) => (
				<group key={i}>
					<Person shirt={c as string} skin={s as string} hair="#2a1d16" hairStyle={i % 2 ? 'long' : 'short'} p={[x as number, 0, z as number]} yaw={Math.PI + 0.2} headYaw={Math.sin(f * 0.03 + i) * 0.4} />
					<Suitcase p={[(x as number) + 0.45, 0, z as number]} c={['#333', '#a23', '#2a6', '#555'][i]} />
				</group>
			))}
			{[-1.6, 1.6].map((x) =>
				[1.4, 2.6, 3.8].map((z) => <Cyl key={`${x}${z}`} p={[x, 0.5, z]} rt={0.03} h={1} c="#9aa0a6" />),
			)}
			{close ? (
				<Cam p={lerp3([-0.5, 1.66, 0.8], [-0.5, 1.6, 0.74], ramp(f, 50, 90))} t={[-0.5, 1.09, 0.2]} fov={42} />
			) : (
				<Cam p={lerp3([2.6, 2.35, 6.8], [2.2, 2.25, 6.1], u)} t={[-0.1, 1.7, -0.6]} fov={52} />
			)}
		</>
	);
};

// ---------- CASH ONLY ----------
const Bills: React.FC = () => (
	<group rotation={[1.2, 0, 0]}>
		{[0, 1, 2].map((i) => (
			<B key={i} p={[0, i * 0.004, i * 0.01]} s={[0.15, 0.003, 0.07]} c="#7fae6a" r={[0, i * 0.15, 0]} />
		))}
	</group>
);

export const CashOnly: React.FC<{f: number}> = ({f}) => {
	const drawer = smooth(ramp(f, 20, 40)) * 0.3;
	return (
		<StoreSet terminal={cardOffline} customerArms="card" customerHold={<Bills />} cashierArms="hold" queueLen={3}>
			<group position={[-0.55, 1.05, 0.22]} rotation={[-0.2, -0.45, 0]}>
				<B p={[0, 0.17, -0.01]} s={[0.46, 0.36, 0.015]} c="#8b5a2b" />
				<Screen p={[0, 0.17, 0.0]} w={0.42} h={0.32} res={420} draw={cashSign} />
			</group>
			<B p={[-0.9, 1.08 - 0.05, -0.05 + drawer]} s={[0.36, 0.08, 0.3]} c="#3a3d44" />
			<Cam p={lerp3([-1.7, 1.62, 2.0], [-1.45, 1.58, 1.75], ramp(f, 0, 90))} t={[-0.1, 1.15, 0.2]} fov={52} />
		</StoreSet>
	);
};

// ---------- STUDENTS ----------
const StudyRoom: React.FC<{children?: React.ReactNode}> = ({children}) => {
	const tex = useStaticTexture(512, 256, skyline('dusk'), 'sky-dusk-small');
	return (
		<>
			<Env bg="#1c1a26" fog={['#1c1a26', 4, 18]} />
			<hemisphereLight args={['#8a88c0', '#4a3a30', 1.5]} />
			<ambientLight intensity={0.25} />
			<pointLight position={[-0.6, 1.35, -0.1]} intensity={9} distance={8} decay={1} color="#ffcf8a" />
			<B p={[0, -0.05, 0]} s={[8, 0.1, 8]} c="#5b4636" />
			<B p={[0, 1.5, -1.6]} s={[8, 3.1, 0.1]} c="#6a6280" />
			<mesh position={[1.4, 1.6, -1.54]}>
				<planeGeometry args={[1.6, 1.0]} />
				<meshBasicMaterial map={tex} toneMapped={false} fog={false} />
			</mesh>
			<B p={[0, 0.73, 0]} s={[2.0, 0.05, 0.9]} c="#8a6a4a" />
			{[-0.95, 0.95].map((x) => (
				<B key={x} p={[x, 0.36, 0]} s={[0.05, 0.72, 0.8]} c="#4a3a2a" />
			))}
			{/* lamp */}
			<Cyl p={[-0.6, 0.77, -0.15]} rt={0.08} h={0.03} c="#222" />
			<Cyl p={[-0.6, 1.0, -0.15]} rt={0.012} h={0.45} c="#222" />
			<mesh position={[-0.6, 1.25, -0.1]}>
				<coneGeometry args={[0.12, 0.14, 8, 1, true]} />
				<meshBasicMaterial color="#ffd89a" side={THREE.DoubleSide} />
			</mesh>
			{[0, 1, 2].map((i) => (
				<B key={i} p={[0.7, 0.78 + i * 0.05, -0.2]} s={[0.3, 0.045, 0.22]} c={['#a23b3b', '#2e5d8a', '#d9a21b'][i]} r={[0, i * 0.2, 0]} />
			))}
			<B p={[-0.25, 0.76, -0.25]} s={[0.21, 0.01, 0.29]} c="#f6f3ea" r={[0, 0.3, 0]} />
			{children}
		</>
	);
};

// 1110–1274: cloud AI is down; a local model writes a fix nobody can verify; errors double
export const OfficeAI: React.FC<{f: number}> = ({f}) => {
	const others = codeDraws.map((_, i) => redScreen(i * 7 + 3));
	const pager = {draw: pagerScreen(f + 300), buzz: f % 16 < 8 ? Math.sin(f * 2.3) : 0};
	if (f < 110) {
		return (
			<OfficeSet mode="dusk" hero={aiScreen(f)} heroSitter={DANA} others={others} pager={pager}>
				<Cam p={lerp3([0.62, 1.56, 1.95], [0.55, 1.52, 1.8], ramp(f, 0, 110))} t={[0, 1.08, -0.22]} fov={39} />
			</OfficeSet>
		);
	}
	return (
		<OfficeSet mode="dusk" hero={aiScreen(f)} heroSitter={{...DANA, arms: 'shrug', headPitch: 0.45}} others={others} pager={pager}>
			<Cam p={lerp3([3.6, 2.2, 4.6], [3.0, 2.0, 3.8], ramp(f, 110, 165))} t={[-0.3, 0.9, -2.5]} fov={55} />
		</OfficeSet>
	);
};

// 1275–1394: governments call on student coders
const Flag: React.FC<{x: number; c: [string, string]}> = ({x, c}) => (
	<group position={[x, 0, -1.2]}>
		<Cyl p={[0, 1.3, 0]} rt={0.025} h={2.6} c="#c9b16a" />
		<B p={[0.32, 2.15, 0]} s={[0.6, 0.2, 0.02]} c={c[0]} />
		<B p={[0.32, 1.95, 0]} s={[0.6, 0.2, 0.02]} c={c[1]} />
	</group>
);

export const Government: React.FC<{f: number}> = ({f}) => {
	const flashes = [6, 19, 27, 44, 58, 71, 83, 97, 108];
	return (
		<>
			<Env bg="#1a2440" fog={['#1a2440', 8, 28]} />
			<Lights sky="#dfe6ff" ground="#3a3a48" hemi={1.4} sun="#fff4e2" sunI={1.0} sunP={[2, 6, 8]} />
			<B p={[0, -0.05, 0]} s={[14, 0.1, 14]} c="#3a2f2a" />
			<B p={[0, 2, -2]} s={[14, 4.2, 0.1]} c="#1d2a52" />
			<Screen p={[0, 2.25, -1.94]} w={3.0} h={1.8} res={720} draw={briefingScreen(f)} />
			{[-1.9, -1.35, 1.0, 1.55].map((x, i) => (
				<Flag key={x} x={x} c={([['#2e5fbf', '#ffffff'], ['#d23b3b', '#f2c94c'], ['#2f9e5b', '#ffffff'], ['#f2994a', '#2d9cdb']] as [string, string][])[i]} />
			))}
			{/* podium */}
			<B p={[0, 0.55, 0]} s={[0.8, 1.1, 0.5]} c="#4a3426" />
			<B p={[0, 1.12, 0.02]} s={[0.9, 0.05, 0.6]} c="#5c4231" />
			<mesh position={[0, 0.62, 0.26]}>
				<circleGeometry args={[0.18, 16]} />
				<meshBasicMaterial color="#d8b75a" />
			</mesh>
			<Cyl p={[0.12, 1.25, 0.15]} rt={0.008} h={0.25} c="#111" r={[0.4, 0, 0]} />
			<Person shirt="#1f2433" pants="#1f2433" hair="#6b6b6b" skin="#c99a78" p={[0, 0, -0.45]} arms={f % 60 < 30 ? 'hold' : 'type'} headYaw={Math.sin(f * 0.04) * 0.3} />
			{/* press in the foreground */}
			{[
				[-1.3, 2.6, '#4a4a4a'],
				[-0.75, 3.0, '#6b3a3a'],
				[0.8, 2.7, '#2d4a6b'],
				[1.35, 3.1, '#5a5a3a'],
			].map(([x, z, c], i) => (
				<Person key={i} shirt={c as string} hair="#2a1d16" skin="#b98563" p={[x as number, 0, z as number]} yaw={Math.PI} arms={i % 2 ? 'phone' : 'hold'} hold={<B s={[0.14, 0.1, 0.08]} c="#151515" />} />
			))}
			{flashes.map((t, i) =>
				f >= t && f < t + 3 ? (
					<group key={i}>
						<B p={[-1.3 + (i % 4) * 0.85, 1.75, 2.45 + (i % 3) * 0.15]} s={[0.12, 0.1, 0.02]} c="#ffffff" basic />
						<pointLight position={[-1.3 + (i % 4) * 0.85, 1.8, 2.3]} intensity={6} distance={6} color="#ffffff" />
					</group>
				) : null,
			)}
			<Cam p={lerp3([0.1, 2.2, 5.8], [0.05, 2.15, 5.1], ramp(f, 0, 120))} t={[0, 1.75, -0.6]} fov={52} />
		</>
	);
};

// Retired and former engineers (not currently working as engineers) come back to teach
const MENTOR: PersonProps = {shirt: '#7a6a55', pants: '#3a3530', hair: '#d9d9d6', skin: '#d4a684'};

const lectureScreen = (f: number) => (ctx: CanvasRenderingContext2D, W: number, H: number) => {
	ctx.fillStyle = '#fbfaf6';
	ctx.fillRect(0, 0, W, H);
	ctx.fillStyle = '#1f3b73';
	ctx.fillRect(0, 0, W, H * 0.22);
	ctx.fillStyle = '#fff';
	ctx.font = '800 44px Helvetica, Arial';
	ctx.textAlign = 'left';
	ctx.textBaseline = 'middle';
	ctx.fillText('CRASH COURSE · Day 3', 30, H * 0.11);
	ctx.fillStyle = '#1d1d1d';
	ctx.font = '700 34px Helvetica, Arial';
	const lines = ['How payments-api works', 'Renewing certificates', 'Being on-call', 'Reviewing code safely'];
	lines.forEach((l, i) => {
		if (f > 8 + i * 18) ctx.fillText(`• ${l}`, 40, H * 0.36 + i * H * 0.15);
	});
};

export const Mentors: React.FC<{f: number}> = ({f}) => {
	const rows = [0.4, 1.5, 2.6];
	const cols = [-1.65, -0.55, 0.55, 1.65];
	const extras: PersonProps[] = [
		{shirt: '#c0392b', hair: '#3b2a1d', hairStyle: 'long', skin: '#e0b79a'},
		{shirt: '#2e86ab', hair: '#2a1d16', skin: '#c99a78'},
		{shirt: '#7b61ff', hair: '#111', skin: '#d9a982'},
		{shirt: '#556b2f', hair: '#5b3a22', hairStyle: 'cap', skin: '#a8714f'},
		{shirt: '#e6a157', hair: '#2a1d16', hairStyle: 'bun', skin: '#7a4b33'},
	];
	let k = 0;
	return (
		<>
			<Env bg="#e8e4da" fog={['#e8e4da', 7, 24]} />
			<Lights sky="#ffffff" ground="#857c70" hemi={1.6} sun="#fff1dc" sunI={0.9} sunP={[-4, 6, 4]} />
			<B p={[0, -0.05, 0.5]} s={[9, 0.1, 9]} c="#9b8c78" />
			<B p={[0, 1.6, -2.6]} s={[9, 3.3, 0.1]} c="#e2ddd2" />
			<B p={[-4.4, 1.6, 0.5]} s={[0.1, 3.3, 9]} c="#d8d2c6" />
			<B p={[0, 1.75, -2.53]} s={[3.3, 1.9, 0.04]} c="#2b2d31" />
			<Screen p={[0, 1.75, -2.5]} w={3.2} h={1.8} res={800} draw={lectureScreen(f)} />
			{/* presenter: a retired engineer */}
			<Person shirt="#7a6a55" pants="#3a3530" hair="#d9d9d6" skin="#d4a684" p={[1.55, 0, -1.7]} yaw={-0.5} arms={f % 50 < 30 ? 'wave' : 'hold'} headYaw={Math.sin(f * 0.05) * 0.3} />
			<Person shirt="#5d6b7a" pants="#2f2f35" hair="#bdbdbd" hairStyle="bun" skin="#e1b595" p={[-1.9, 0, -1.6]} yaw={0.6} arms="hold" headYaw={0.3} />
			{rows.map((z, ri) => (
				<group key={z}>
					<B p={[0, 0.72, z - 0.35]} s={[4.4, 0.05, 0.55]} c="#c7b498" />
					{cols.map((x) => {
						const isMaya = ri === 0 && x === -0.55;
						const isSam = ri === 0 && x === 0.55;
						const who = isMaya ? MAYA : isSam ? SAM : extras[k++ % extras.length];
						return (
							<group key={x}>
								<Chair p={[x, 0, z + 0.15]} yaw={Math.PI} />
								<Person {...who} p={[x, 0, z + 0.15]} yaw={Math.PI} pose="sit" arms="type" headPitch={-0.1} />
								<Laptop p={[x, 0.745, z - 0.4]} open={1} draw={tutorScreen(isMaya ? f - 50 : f + ri * 13 + k * 7)} />
							</group>
						);
					})}
				</group>
			))}
			{f >= 50 ? (
				// a retired engineer checks Maya's work while her local AI tutor explains
				<>
					<Person {...MENTOR} p={[-0.98, 0, -0.18]} yaw={0.9} arms="hold" headPitch={0.5} />
					<Cam p={lerp3([0.18, 1.6, 1.25], [0.1, 1.56, 1.1], ramp(f, 50, 105))} t={[-0.62, 1.08, -0.14]} fov={58} />
				</>
			) : (
				<Cam p={lerp3([3.0, 2.1, 4.6], [2.6, 1.98, 4.05], ramp(f, 0, 50))} t={[0, 1.3, -1.4]} fov={55} />
			)}
		</>
	);
};

// 1395–1589: students start rebuilding
export const Rebuild: React.FC<{f: number}> = ({f}) => {
	const open = smooth(ramp(f, 5, 30));
	const scr = laptopScreen(Math.max(0, f - 30));
	const samArrive = ramp(f, 40, 80);
	const samX = lerp(2.6, 0.75, samArrive);
	const samSeated = f >= 81;
	const students = (
		<>
			<Chair p={[0, 0, 0.62]} yaw={Math.PI} />
			<Person {...MAYA} p={[0, 0, 0.62]} yaw={Math.PI} pose="sit" arms={f < 30 ? 'hold' : 'type'} headPitch={0.2} />
			<Laptop p={[0, 0.755, 0.05]} open={open} draw={scr} />
			<Chair p={[0.75, 0, 0.66]} yaw={Math.PI - 0.2} />
			{samSeated ? (
				<Person {...SAM} p={[0.75, 0, 0.66]} yaw={Math.PI - 0.35} pose="sit" arms="type" headYaw={0.35} headPitch={0.2} />
			) : (
				<Person {...SAM} p={[samX, 0, 1.0]} yaw={-Math.PI / 2 - 0.2} walk={f * 0.32} headYaw={-0.5} />
			)}
		</>
	);
	if (f < 81 || f >= 130) {
		return (
			<StudyRoom>
				{students}
				<Cam p={[0.62, 1.68, 1.3]} t={[-0.02, 0.86, -0.02]} fov={46} />
			</StudyRoom>
		);
	}
	return (
		<StudyRoom>
			{students}
			<Cam p={[0.15, 1.3, -1.35]} t={[0.35, 0.95, 0.4]} fov={56} />
		</StudyRoom>
	);
};

// 1650–1799: the office restaffed by the former students; everything works
// Retired engineers stay on as mentors in the restaffed office
const MENTOR2: PersonProps = {shirt: '#5d6b7a', pants: '#2f2f35', hair: '#bdbdbd', hairStyle: 'bun', skin: '#e1b595'};

export const OfficeRestored: React.FC<{f: number}> = ({f}) => {
	const draw = restoredScreen(Math.max(0, f - 95));
	const closeUp = f >= 112;
	const mentors = (
		<>
			<Person {...MENTOR} p={closeUp ? [-1.2, 0, 0.2] : [-0.55, 0, 0.3]} yaw={2.3} arms="hold" headPitch={0.25} />
			<Person {...MENTOR2} p={[3.85, 0, 0.6]} yaw={2.71} arms="hold" headPitch={0.3} />
		</>
	);
	if (f >= 95 && !closeUp) {
		// Maya with her mentor looking on
		return (
			<OfficeSet mode="restored" hero={draw} occupied heroSitter={MAYA}>
				{mentors}
				<Cam p={lerp3([1.35, 1.45, 0.95], [1.25, 1.42, 0.9], ramp(f, 95, 112))} t={[-0.15, 1.2, 0.3]} fov={52} />
			</OfficeSet>
		);
	}
	if (closeUp) {
		// end on Maya's screen: payment approved, call answered
		return (
			<OfficeSet mode="restored" hero={draw} occupied heroSitter={MAYA}>
				{mentors}
				<Cam p={lerp3([0.5, 1.48, 1.6], [0.45, 1.44, 1.42], ramp(f, 112, 150))} t={[0.05, 1.08, -0.22]} fov={40} />
			</OfficeSet>
		);
	}
	if (f >= 35 && f < 70) {
		// Sam at the neighbouring desk with a mentor looking on
		return (
			<OfficeSet mode="restored" hero={draw} occupied heroSitter={MAYA}>
				{mentors}
				<Person {...DANA} p={[-2.3, 0, -1.7]} yaw={0.55} arms="phone" />
				<Cam p={lerp3([5.9, 1.55, 1.9], [5.6, 1.5, 1.6], ramp(f, 35, 70))} t={[4.5, 0.98, -0.1]} fov={52} />
			</OfficeSet>
		);
	}
	const u = f < 35 ? smooth(ramp(f, 0, 35)) : smooth(ramp(f, 70, 95));
	return (
		<OfficeSet mode="restored" hero={draw} occupied heroSitter={MAYA}>
			{mentors}
			<Person {...DANA} p={[-2.3, 0, -1.7]} yaw={0.55} arms={f >= 70 ? 'wave' : 'phone'} />
			<Cam p={f < 35 ? lerp3([4.0, 2.1, 4.4], [3.4, 1.9, 3.7], u) : lerp3([2.6, 1.8, 3.2], [2.0, 1.7, 2.7], u)} t={[0, 0.95, -1.4]} fov={55} />
		</OfficeSet>
	);
};
