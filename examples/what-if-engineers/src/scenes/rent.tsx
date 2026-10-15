// +5 days: so many apartments empty out that rent in the Marina finally drops. Prices are invented.
import React from 'react';
import {B, Cam, Cyl, Draw, Env, Lights, Screen, Sky} from '../three/core';
import {PhoneRig} from '../three/prims';
import {clamp, lerp, lerp3, ramp, smooth} from '../lib';

const SANS = 'Helvetica, Arial, sans-serif';
const COLORS = ['#f3d9c4', '#f6e7b8', '#e8c9d6', '#d4e4ef', '#f1ead8', '#dcebd2'];
const SIGN_AT = [6, 13, 20, 27, 34, 41];

const forRent: Draw = (ctx, W, H) => {
	ctx.fillStyle = '#ffffff';
	ctx.fillRect(0, 0, W, H);
	ctx.fillStyle = '#c8161d';
	ctx.fillRect(0, 0, W, H * 0.55);
	ctx.fillStyle = '#fff';
	ctx.font = `900 ${H * 0.36}px ${SANS}`;
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.fillText('FOR RENT', W / 2, H * 0.29);
	ctx.fillStyle = '#c8161d';
	ctx.font = `700 ${H * 0.2}px ${SANS}`;
	ctx.fillText('available now', W / 2, H * 0.77);
};

const listing = (f: number): Draw => (ctx, W, H) => {
	ctx.fillStyle = '#ffffff';
	ctx.fillRect(0, 0, W, H);
	ctx.fillStyle = '#111';
	ctx.font = `800 17px ${SANS}`;
	ctx.textBaseline = 'middle';
	ctx.textAlign = 'left';
	ctx.fillText('Rentals · San Francisco', 14, 28);
	ctx.fillStyle = '#f3d9c4';
	ctx.fillRect(12, 48, W - 24, 120);
	ctx.fillStyle = '#b5532f';
	ctx.fillRect(12, 48, W - 24, 14);
	ctx.fillStyle = '#fff';
	ctx.fillRect(40, 80, 50, 60);
	ctx.fillRect(W - 90, 80, 50, 60);
	ctx.fillStyle = '#111';
	ctx.font = `700 16px ${SANS}`;
	ctx.fillText('1BR · Marina District', 14, 188);
	ctx.fillStyle = '#888';
	ctx.font = `700 22px ${SANS}`;
	ctx.fillText('$4,200/mo', 14, 222);
	ctx.strokeStyle = '#c8161d';
	ctx.lineWidth = 3;
	ctx.beginPath();
	ctx.moveTo(10, 222);
	ctx.lineTo(132, 222);
	ctx.stroke();
	const k = smooth(ramp(f, 10, 60));
	const price = Math.round(lerp(4200, 1900, k) / 10) * 10;
	ctx.fillStyle = '#1f7a3a';
	ctx.font = `900 34px ${SANS}`;
	ctx.fillText(`$${price.toLocaleString('en-US')}`, 14, 262);
	if (k >= 1) {
		ctx.fillStyle = '#c8161d';
		ctx.beginPath();
		ctx.roundRect(14, 290, W - 28, 34, 17);
		ctx.fill();
		ctx.fillStyle = '#fff';
		ctx.font = `800 15px ${SANS}`;
		ctx.textAlign = 'center';
		ctx.fillText('PRICE DROP ▼ 55%', W / 2, 307);
	}
	ctx.fillStyle = '#555';
	ctx.font = `600 13px ${SANS}`;
	ctx.textAlign = 'left';
	ctx.fillText(`${clamp(Math.round(40 + f * 3), 40, 312)} new listings today`, 14, H - 22);
};

// A Marina-style stucco house (flat roof, red tile trim, arched windows), front facing +Z
const House: React.FC<{x: number; color: string; i: number; f: number}> = ({x, color, i, f}) => {
	const pop = clamp((f - SIGN_AT[i]) / 4);
	const signScale = pop <= 0 ? 0 : 1 + 0.25 * Math.sin(pop * Math.PI);
	const arch = (wx: number, wy: number) => (
		<group position={[wx, wy, 3.03]}>
			<B s={[1.2, 1.3, 0.04]} c="#2b3a4a" />
			<mesh position={[0, 0.65, 0]} rotation={[Math.PI / 2, 0, 0]}>
				<cylinderGeometry args={[0.6, 0.6, 0.04, 10, 1, false, 0, Math.PI]} />
				<meshLambertMaterial color="#2b3a4a" flatShading />
			</mesh>
		</group>
	);
	return (
		<group position={[x, 0, 0]}>
			<B p={[0, 3.3, 0]} s={[3.9, 6.6, 6]} c={color} />
			<B p={[0, 6.75, 3.05]} s={[4.1, 0.35, 0.5]} r={[0.35, 0, 0]} c="#b5532f" />
			<B p={[0, 6.7, 0]} s={[4.0, 0.2, 6.1]} c="#e9e2d2" />
			{arch(-0.9, 4.4)}
			{arch(0.9, 4.4)}
			{arch(-0.9, 1.6)}
			<B p={[1.0, 1.25, 3.04]} s={[0.95, 2.1, 0.04]} c="#7a4f2e" />
			<B p={[0, 3.25, 3.15]} s={[3.2, 0.12, 0.35]} c="#e9e2d2" />
			{[0, 1, 2].map((k) => (
				<B key={k} p={[1.0, 0.12 + k * 0.24, 3.4 + (2 - k) * 0.3]} s={[1.2, 0.24, 0.35]} c="#e8e4dc" />
			))}
			{pop > 0 ? (
				<group position={[-0.9, 4.25, 3.1]} scale={signScale}>
					<Screen w={1.15} h={0.7} res={300} draw={forRent} />
				</group>
			) : null}
		</group>
	);
};

const Palm: React.FC<{x: number; z: number}> = ({x, z}) => (
	<group position={[x, 0, z]}>
		<Cyl p={[0, 2.6, 0]} rt={0.12} rb={0.18} h={5.2} c="#8a6a48" seg={6} />
		{[0, 1, 2, 3, 4, 5].map((k) => (
			<B key={k} p={[Math.cos(k) * 0.9, 5.2, Math.sin(k) * 0.9]} s={[1.9, 0.08, 0.45]} r={[0, -k, -0.35]} c="#4f7a3a" />
		))}
	</group>
);

// The bridge across the water behind the Marina
const DistantBridge: React.FC = () => (
	<group position={[-150, 0, -420]}>
		{[-60, 60].map((x) => (
			<group key={x} position={[x * 1.15, 0, 0]}>
				<B p={[-8, 90, 0]} s={[5, 200, 6]} c="#b9392b" />
				<B p={[8, 90, 0]} s={[5, 200, 6]} c="#b9392b" />
				{[60, 120, 170].map((y) => (
					<B key={y} p={[0, y, 0]} s={[20, 6, 4]} c="#b9392b" />
				))}
			</group>
		))}
		<B p={[0, 40, 0]} s={[900, 5, 14]} c="#9c3125" />
	</group>
);

const Marina: React.FC<{f: number; fog: [string, number, number]}> = ({f, fog}) => {
	const xs = [-8, -4, 0, 4, 8, 12];
	return (
		<>
			<Env bg="#cfdcea" fog={fog} />
			<Sky stops={[[0, '#8fb3d9'], [0.5, '#e2eaf1'], [1, '#c9d6c2']]} />
			<Lights sky="#f4f8ff" ground="#7a8a6a" hemi={1.5} sun="#fff1d6" sunI={1.6} sunP={[20, 30, 30]} />
			<mesh position={[0, -1, -400]} rotation={[-Math.PI / 2, 0, 0]}>
				<planeGeometry args={[3000, 800]} />
				<meshLambertMaterial color="#6f8fa6" />
			</mesh>
			<DistantBridge />
			<B p={[0, -0.05, 20]} s={[80, 0.1, 60]} c="#5a5c60" />
			<B p={[0, 0.06, 4.6]} s={[80, 0.12, 3]} c="#cfc9bd" />
			<B p={[0, 0.03, 26]} s={[80, 0.06, 14]} c="#6f9a55" />
			{xs.map((x, i) => (
				<House key={x} x={x} color={COLORS[i % COLORS.length]} i={i} f={f} />
			))}
			<Palm x={-6} z={5.4} />
			<Palm x={6} z={5.4} />
		</>
	);
};

export const Rent: React.FC<{f: number}> = ({f}) => {
	if (f < 55) {
		return (
			<>
				<Marina f={f} fog={['#d9e3ec', 30, 1400]} />
				<Cam p={lerp3([9, 1.6, 32], [8, 1.7, 29], ramp(f, 0, 55))} t={[0.5, 7.5, 0]} fov={54} />
			</>
		);
	}
	return (
		<>
			<Marina f={60} fog={['#d9e3ec', 8, 1400]} />
			<PhoneRig p={[2, 1.5, 9]} r={[-0.2, 0, 0]} draw={listing(f - 55)} tap={0} sleeve="#3c6e8f" skin="#c99a78" />
			<Cam p={lerp3([2.03, 1.56, 9.38], [2.03, 1.55, 9.34], ramp(f, 55, 150))} t={[2, 1.49, 9]} fov={42} />
		</>
	);
};
