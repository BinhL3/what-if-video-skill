import React from 'react';
import type {V3} from '../lib';
import {B, Blob, Cyl, Draw, Screen} from './core';

// ---------- People ----------
type ArmPose = {u: [number, number]; f: number};
const ARMS: Record<string, [ArmPose, ArmPose]> = {
	down: [
		{u: [0, 0.07], f: -0.12},
		{u: [0, 0.07], f: -0.12},
	],
	type: [
		{u: [-0.45, 0.14], f: -1.15},
		{u: [-0.45, 0.14], f: -1.15},
	],
	hold: [
		{u: [-0.2, 0.22], f: -1.45},
		{u: [-0.2, 0.22], f: -1.45},
	],
	phone: [
		{u: [0, 0.07], f: -0.12},
		{u: [-0.35, 0.95], f: -2.2},
	],
	card: [
		{u: [0, 0.07], f: -0.12},
		{u: [-0.75, 0.12], f: -0.75},
	],
	write: [
		{u: [-0.4, 0.3], f: -1.25},
		{u: [-0.55, 0.05], f: -1.0},
	],
	shrug: [
		{u: [-0.15, 0.6], f: -1.4},
		{u: [-0.15, 0.6], f: -1.4},
	],
	wheel: [
		{u: [-0.75, 0.18], f: -0.75},
		{u: [-0.75, 0.18], f: -0.75},
	],
	wave: [
		{u: [0, 0.07], f: -0.12},
		{u: [-0.2, 1.4], f: -1.6},
	],
};

export type PersonProps = {
	p?: V3;
	yaw?: number;
	shirt: string;
	pants?: string;
	skin?: string;
	hair?: string;
	hairStyle?: 'short' | 'long' | 'bun' | 'cap';
	pose?: 'stand' | 'sit';
	arms?: keyof typeof ARMS;
	armBlend?: number;
	headYaw?: number;
	headPitch?: number;
	walk?: number;
	scale?: number;
	shadow?: boolean;
	hold?: React.ReactNode;
	noHead?: boolean;
};

const Arm: React.FC<{side: 1 | -1; a: ArmPose; shirt: string; skin: string; hold?: React.ReactNode}> = ({side, a, shirt, skin, hold}) => (
	<group position={[side * 0.27, 0.53, 0]} rotation={[a.u[0], 0, side * a.u[1]]}>
		<B p={[0, -0.15, 0]} s={[0.12, 0.31, 0.13]} c={shirt} />
		<group position={[0, -0.3, 0]} rotation={[a.f, 0, 0]}>
			<B p={[0, -0.14, 0]} s={[0.11, 0.28, 0.12]} c={shirt} />
			<B p={[0, -0.32, 0]} s={[0.09, 0.1, 0.09]} c={skin} />
			{hold ? <group position={[0, -0.36, 0.02]}>{hold}</group> : null}
		</group>
	</group>
);

const Leg: React.FC<{side: 1 | -1; t: number; s: number; pants: string}> = ({side, t, s, pants}) => (
	<group position={[side * 0.11, 0, 0]} rotation={[t, 0, 0]}>
		<B p={[0, -0.225, 0]} s={[0.17, 0.45, 0.19]} c={pants} />
		<group position={[0, -0.45, 0]} rotation={[s, 0, 0]}>
			<B p={[0, -0.21, 0]} s={[0.15, 0.42, 0.17]} c={pants} />
			<B p={[0, -0.43, 0.05]} s={[0.15, 0.07, 0.27]} c="#1d1d22" />
		</group>
	</group>
);

const mixArm = (a: ArmPose, b: ArmPose, k: number): ArmPose => ({
	u: [a.u[0] + (b.u[0] - a.u[0]) * k, a.u[1] + (b.u[1] - a.u[1]) * k],
	f: a.f + (b.f - a.f) * k,
});

export const Person: React.FC<PersonProps> = ({
	p = [0, 0, 0],
	yaw = 0,
	shirt,
	pants = '#2d2f3a',
	skin = '#c99a78',
	hair = '#2a1d16',
	hairStyle = 'short',
	pose = 'stand',
	arms = 'down',
	armBlend = 1,
	headYaw = 0,
	headPitch = 0,
	walk,
	scale = 1,
	shadow = true,
	hold,
	noHead,
}) => {
	const sit = pose === 'sit';
	const hipY = sit ? 0.48 : 0.9;
	let lt = 0,
		ls = 0,
		rt = 0,
		rs = 0;
	let armSet = ARMS[arms].map((a, i) => mixArm(ARMS.down[i], a, armBlend)) as [ArmPose, ArmPose];
	if (sit) {
		lt = rt = -1.57;
		ls = rs = 1.57;
	} else if (walk !== undefined) {
		const w = Math.sin(walk);
		lt = 0.42 * w;
		rt = -0.42 * w;
		ls = 0.35 * Math.max(0, -w);
		rs = 0.35 * Math.max(0, w);
		if (arms === 'down') {
			armSet = [
				{u: [-0.3 * w, 0.07], f: -0.2},
				{u: [0.3 * w, 0.07], f: -0.2},
			];
		}
	}
	const bob = walk !== undefined ? Math.abs(Math.cos(walk)) * 0.03 : 0;
	return (
		<group position={p} rotation={[0, yaw, 0]} scale={scale}>
			{shadow && !sit ? <Blob w={0.6} d={0.5} /> : null}
			<group position={[0, hipY + bob, 0]}>
				<Leg side={1} t={lt} s={ls} pants={pants} />
				<Leg side={-1} t={rt} s={rs} pants={pants} />
				<B p={[0, 0.04, 0]} s={[0.38, 0.14, 0.23]} c={pants} />
				<B p={[0, 0.3, 0]} s={[0.43, 0.56, 0.25]} c={shirt} />
				<Arm side={1} a={armSet[0]} shirt={shirt} skin={skin} />
				<Arm side={-1} a={armSet[1]} shirt={shirt} skin={skin} hold={hold} />
				{noHead ? null : (
					<group position={[0, 0.79, 0]} rotation={[headPitch, headYaw, 0]}>
						<B p={[0, -0.14, 0]} s={[0.1, 0.08, 0.1]} c={skin} />
						<mesh scale={[1, 1.13, 1.03]}>
							<sphereGeometry args={[0.13, 7, 6]} />
							<meshLambertMaterial color={skin} flatShading />
						</mesh>
						<B p={[0.048, 0.02, 0.122]} s={[0.032, 0.022, 0.01]} c="#1a1410" />
						<B p={[-0.048, 0.02, 0.122]} s={[0.032, 0.022, 0.01]} c="#1a1410" />
						<mesh position={[0, 0.045, -0.02]} scale={[1.08, 0.95, 1.08]}>
							<sphereGeometry args={[0.135, 7, 5, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
							<meshLambertMaterial color={hair} flatShading />
						</mesh>
						{hairStyle === 'long' ? <B p={[0, -0.1, -0.09]} s={[0.27, 0.32, 0.08]} c={hair} /> : null}
						{hairStyle === 'bun' ? <Cyl p={[0, 0.12, -0.11]} rt={0.06} h={0.08} c={hair} r={[1.2, 0, 0]} /> : null}
						{hairStyle === 'cap' ? (
							<>
								<B p={[0, 0.1, 0]} s={[0.28, 0.08, 0.28]} c={hair} />
								<B p={[0, 0.08, 0.17]} s={[0.24, 0.025, 0.12]} c={hair} />
							</>
						) : null}
					</group>
				)}
			</group>
		</group>
	);
};

// ---------- Vehicles ----------
export type CarProps = {
	x: number;
	z: number;
	yaw?: number;
	pitch?: number;
	color: string;
	brake?: number;
	driver?: PersonProps | null;
	driverVisible?: boolean;
	waymo?: boolean;
	passengers?: PersonProps[];
	nav?: Draw;
};

const GLASS = '#1d2a36';

export const Car: React.FC<CarProps> = ({x, z, yaw = 0, pitch = 0, color, brake = 0, driver, driverVisible = true, waymo, passengers, nav}) => {
	const spin = z / 0.33;
	const wheels: V3[] = [
		[0.9, 0.33, 1.45],
		[-0.9, 0.33, 1.45],
		[0.9, 0.33, -1.45],
		[-0.9, 0.33, -1.45],
	];
	return (
		<group position={[x, 0, z]} rotation={[pitch, yaw, 0]}>
			<Blob w={2.3} d={5} o={0.33} />
			<B p={[0, 0.66, 0]} s={[1.86, 0.58, 4.5]} c={color} />
			<B p={[0, 0.42, 2.25]} s={[1.84, 0.24, 0.08]} c="#26272b" />
			<B p={[0, 0.42, -2.25]} s={[1.84, 0.24, 0.08]} c="#26272b" />
			{/* cabin */}
			<mesh position={[0, 1.2, -0.25]}>
				<boxGeometry args={[1.64, 0.5, 2.3]} />
				<meshLambertMaterial color={GLASS} transparent opacity={0.32} depthWrite={false} />
			</mesh>
			<B p={[0, 1.47, -0.32]} s={[1.6, 0.06, 1.95]} c={color} />
			{(
				[
					[0.79, 0.88],
					[-0.79, 0.88],
					[0.79, -1.38],
					[-0.79, -1.38],
				] as [number, number][]
			).map(([px, pz], i) => (
				<B key={i} p={[px, 1.2, pz]} s={[0.07, 0.52, 0.09]} c={color} />
			))}
			{/* interior */}
			<B p={[0, 1.0, 0.82]} s={[1.6, 0.14, 0.32]} c="#18191c" />
			{[0.4, -0.4].map((sx) => (
				<group key={sx}>
					<B p={[sx, 0.62, 0.05]} s={[0.5, 0.1, 0.5]} c="#2a2a2e" />
					<B p={[sx, 0.95, -0.22]} s={[0.5, 0.62, 0.1]} c="#2a2a2e" r={[-0.12, 0, 0]} />
					<B p={[sx, 1.32, -0.27]} s={[0.26, 0.14, 0.08]} c="#2a2a2e" />
				</group>
			))}
			<B p={[0, 0.95, -0.95]} s={[1.5, 0.6, 0.12]} c="#2a2a2e" />
			{!waymo ? (
				<mesh position={[0.4, 1.08, 0.55]} rotation={[0.45, 0, 0]}>
					<torusGeometry args={[0.16, 0.025, 4, 10]} />
					<meshLambertMaterial color="#111" flatShading />
				</mesh>
			) : null}
			{driver && driverVisible ? <Person {...driver} p={[0.4, 0.1, 0.02]} pose="sit" arms="wheel" scale={0.92} shadow={false} /> : null}
			{passengers?.map((pp, i) => (
				<Person key={i} {...pp} p={[i === 0 ? 0.4 : -0.4, 0.1, -0.9]} pose="sit" scale={0.9} shadow={false} />
			))}
			{nav ? (
				<group position={[0, 1.22, 0.62]} rotation={[0, Math.PI, 0]}>
					<group rotation={[-0.25, 0, 0]}>
						<B p={[0, 0, -0.012]} s={[0.36, 0.23, 0.02]} c="#0c0c0e" />
						<Screen w={0.33} h={0.2} res={480} draw={nav} />
					</group>
				</group>
			) : null}
			{/* lights */}
			{[0.62, -0.62].map((lx) => (
				<group key={lx}>
					<B p={[lx, 0.8, 2.26]} s={[0.38, 0.13, 0.02]} c="#fff7da" e="#fff2c8" ei={0.7} />
					<B p={[lx * 1.06, 0.82, -2.26]} s={[0.34, 0.13, 0.02]} c="#5a0a0a" e="#ff1c1c" ei={0.15 + brake * 1.6} />
				</group>
			))}
			{wheels.map((w, i) => (
				<group key={i} position={w} rotation={[spin, 0, 0]}>
					<Cyl r={[0, 0, Math.PI / 2]} rt={0.33} h={0.24} c="#151517" seg={8} />
				</group>
			))}
			{waymo ? (
				<>
					<Cyl p={[0, 1.6, -0.25]} rt={0.24} rb={0.28} h={0.22} c="#e6e6e3" seg={10} />
					<Cyl p={[0, 1.78, -0.25]} rt={0.18} rb={0.21} h={0.16} c="#1b1c1f" seg={10} />
					<B p={[0.97, 0.98, 1.55]} s={[0.12, 0.16, 0.24]} c="#1b1c1f" />
					<B p={[-0.97, 0.98, 1.55]} s={[0.12, 0.16, 0.24]} c="#1b1c1f" />
					<B p={[0, 1.5, 0.75]} s={[0.4, 0.08, 0.12]} c="#1b1c1f" />
				</>
			) : null}
		</group>
	);
};

// ---------- Office furniture ----------
export const Chair: React.FC<{p: V3; yaw?: number; c?: string}> = ({p, yaw = 0, c = '#2b2d33'}) => (
	<group position={p} rotation={[0, yaw, 0]}>
		<Blob w={0.7} d={0.7} o={0.22} />
		<B p={[0, 0.47, 0]} s={[0.52, 0.08, 0.5]} c={c} />
		<B p={[0, 0.84, -0.25]} s={[0.5, 0.62, 0.07]} c={c} r={[-0.08, 0, 0]} />
		<Cyl p={[0, 0.25, 0]} rt={0.03} h={0.42} c="#55575c" />
		<B p={[0, 0.04, 0]} s={[0.62, 0.05, 0.07]} c="#3a3c42" />
		<B p={[0, 0.04, 0]} s={[0.07, 0.05, 0.62]} c="#3a3c42" />
	</group>
);

export const Monitor: React.FC<{p: V3; draw: Draw; res?: number; yaw?: number}> = ({p, draw, res = 384, yaw = 0}) => (
	<group position={p} rotation={[0, yaw, 0]}>
		<B p={[0, 0, -0.025]} s={[0.66, 0.41, 0.04]} c="#141518" />
		<Screen p={[0, 0.005, -0.004]} w={0.62} h={0.37} res={res} draw={draw} />
		<B p={[0, -0.27, -0.05]} s={[0.05, 0.16, 0.04]} c="#2c2d31" />
		<B p={[0, -0.335, -0.05]} s={[0.24, 0.02, 0.16]} c="#2c2d31" />
	</group>
);

export const Desk: React.FC<{p: V3; c?: string}> = ({p, c = '#c7b498'}) => (
	<group position={p}>
		<B p={[0, 0.73, 0]} s={[1.6, 0.05, 0.8]} c={c} />
		<B p={[0.76, 0.36, 0]} s={[0.05, 0.72, 0.74]} c="#8a8f96" />
		<B p={[-0.76, 0.36, 0]} s={[0.05, 0.72, 0.74]} c="#8a8f96" />
		<B p={[0, 0.77, 0.12]} s={[0.46, 0.025, 0.15]} c="#2e3036" />
		<Cyl p={[0.55, 0.81, 0.1]} rt={0.04} h={0.11} c="#e9e4da" />
	</group>
);

const STICKERS = ['#ff5a5f', '#ffd23f', '#3bceac', '#7b61ff', '#ff8c42'];

export const Laptop: React.FC<{p: V3; yaw?: number; open: number; draw?: Draw; body?: string}> = ({p, yaw = 0, open, draw, body = '#8d9097'}) => {
	const lid = -Math.PI / 2 - 0.25;
	return (
		<group position={p} rotation={[0, yaw, 0]}>
			<B p={[0, 0.01, 0]} s={[0.34, 0.02, 0.24]} c={body} />
			<B p={[0, 0.022, 0.02]} s={[0.29, 0.005, 0.11]} c="#2b2c30" />
			<group position={[0, 0.02, -0.12]} rotation={[lid * open, 0, 0]}>
				<group rotation={[0, 0, 0]}>
					<B p={[0, 0.006, 0.12]} s={[0.34, 0.012, 0.24]} c={body} />
					{STICKERS.map((c, i) => (
						<B key={i} p={[-0.1 + (i % 3) * 0.09, 0.0135, 0.06 + Math.floor(i / 3) * 0.09 + (i % 2) * 0.02]} s={[0.05, 0.004, 0.05]} c={c} r={[0, i * 0.5, 0]} />
					))}
					{draw ? <Screen p={[0, -0.0008, 0.12]} r={[Math.PI / 2, 0, 0]} w={0.3} h={0.2} res={420} draw={draw} /> : null}
				</group>
			</group>
		</group>
	);
};

// A hand holding a phone, screen facing +Z; thumb taps when tap -> 1.
export const PhoneRig: React.FC<{p: V3; r?: V3; draw: Draw; tap: number; thumbX?: number; thumbY?: number; skin?: string; sleeve?: string}> = ({
	p,
	r,
	draw,
	tap,
	thumbX = 0,
	thumbY = -0.02,
	skin = '#c99a78',
	sleeve = '#b7413a',
}) => (
	<group position={p} rotation={r}>
		<B p={[0, 0, -0.006]} s={[0.078, 0.158, 0.009]} c="#121316" />
		<Screen p={[0, 0, -0.0005]} w={0.07} h={0.148} res={300} draw={draw} fog={false} />
		{/* palm and fingers behind the phone */}
		<B p={[0.005, -0.04, -0.03]} s={[0.1, 0.11, 0.035]} c={skin} />
		{[0, 1, 2].map((i) => (
			<B key={i} p={[-0.05, -0.01 + i * 0.026, -0.012]} s={[0.022, 0.02, 0.03]} c={skin} />
		))}
		<B p={[0.02, -0.14, -0.04]} s={[0.12, 0.12, 0.07]} c={sleeve} />
		{/* thumb: hovers over the lower right of the screen, presses in on tap */}
		<group position={[0.03 + thumbX, -0.055 + thumbY, 0.003 + 0.014 * (1 - tap)]} rotation={[0, 0, 0.55]}>
			<B p={[0, -0.02, 0]} s={[0.018, 0.05, 0.016]} c={skin} />
		</group>
	</group>
);
