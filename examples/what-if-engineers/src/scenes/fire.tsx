// An ordinary apartment fire; the frozen dispatch software makes the response harder,
// so dispatchers route the crew by hand. Fictional incident.
import React from 'react';
import {B, Cam, Cyl, Draw, Env, Screen} from '../three/core';
import {Chair, Desk, Monitor, Person} from '../three/prims';
import {hash, lerp, lerp3, ramp, smooth} from '../lib';

const SANS = 'Helvetica, Arial, sans-serif';

// ---------- screens ----------
const routingScreen: Draw = (ctx, W, H) => {
	ctx.fillStyle = '#1c2430';
	ctx.fillRect(0, 0, W, H);
	ctx.strokeStyle = '#33404f';
	ctx.lineWidth = 6;
	for (let i = 0; i < 7; i++) {
		ctx.beginPath();
		ctx.moveTo(0, 30 + i * 55);
		ctx.lineTo(W, 10 + i * 60);
		ctx.stroke();
		ctx.beginPath();
		ctx.moveTo(40 + i * 90, 0);
		ctx.lineTo(70 + i * 85, H);
		ctx.stroke();
	}
	ctx.fillStyle = '#2b3542';
	ctx.fillRect(0, 0, W, 34);
	ctx.fillStyle = '#e6e6e6';
	ctx.font = `700 18px ${SANS}`;
	ctx.textBaseline = 'middle';
	ctx.fillText('CAD · Incident routing', 12, 17);
	// "not responding" dialog with a frozen spinner
	ctx.fillStyle = 'rgba(0,0,0,0.45)';
	ctx.fillRect(0, 34, W, H);
	ctx.fillStyle = '#f2f2f2';
	ctx.beginPath();
	ctx.roundRect(W * 0.12, H * 0.28, W * 0.76, H * 0.48, 10);
	ctx.fill();
	ctx.strokeStyle = '#9aa0a6';
	ctx.lineWidth = 7;
	ctx.beginPath();
	ctx.arc(W * 0.24, H * 0.52, 22, 0.6, 4.4);
	ctx.stroke();
	ctx.fillStyle = '#111';
	ctx.font = `800 24px ${SANS}`;
	ctx.fillText('Not Responding', W * 0.34, H * 0.44);
	ctx.fillStyle = '#c0161f';
	ctx.font = `600 16px ${SANS}`;
	ctx.fillText('Routing server unreachable', W * 0.34, H * 0.55);
	ctx.fillStyle = '#555';
	ctx.fillText('Waiting…', W * 0.34, H * 0.64);
};

const callQueue = (f: number): Draw => (ctx, W, H) => {
	ctx.fillStyle = '#10141b';
	ctx.fillRect(0, 0, W, H);
	ctx.fillStyle = '#e6e6e6';
	ctx.font = `700 18px ${SANS}`;
	ctx.textBaseline = 'middle';
	ctx.fillText('911 CALLS', 12, 20);
	const rows = ['FIRE · 412 Elm St', 'MEDICAL · 9th & Pine', 'ALARM · 77 Harbor Rd'];
	rows.forEach((r, i) => {
		const on = i === 0 && f % 16 < 8;
		ctx.fillStyle = on ? '#c81e1e' : '#1d2430';
		ctx.fillRect(8, 44 + i * 44, W - 16, 38);
		ctx.fillStyle = '#fff';
		ctx.font = `700 17px ${SANS}`;
		ctx.fillText(r, 18, 63 + i * 44);
	});
};

const paperMap: Draw = (ctx, W, H) => {
	ctx.fillStyle = '#efe6cf';
	ctx.fillRect(0, 0, W, H);
	ctx.fillStyle = '#b9d3e0';
	ctx.beginPath();
	ctx.moveTo(0, H * 0.75);
	ctx.quadraticCurveTo(W * 0.4, H * 0.65, W, H * 0.85);
	ctx.lineTo(W, H);
	ctx.lineTo(0, H);
	ctx.fill();
	ctx.strokeStyle = '#a89c80';
	ctx.lineWidth = 10;
	for (let i = 0; i < 6; i++) {
		ctx.beginPath();
		ctx.moveTo(i * (W / 5), 0);
		ctx.lineTo(i * (W / 5) + 20, H * 0.7);
		ctx.stroke();
		ctx.beginPath();
		ctx.moveTo(0, i * (H / 6));
		ctx.lineTo(W, i * (H / 6) - 10);
		ctx.stroke();
	}
	ctx.fillStyle = '#5a4a32';
	ctx.font = `600 18px ${SANS}`;
	ctx.fillText('ELM ST', W * 0.42, H * 0.31);
	ctx.fillText('5TH AVE', W * 0.05, H * 0.47);
	// hand-drawn route and circled address
	ctx.strokeStyle = '#c0161f';
	ctx.lineWidth = 6;
	ctx.lineCap = 'round';
	ctx.beginPath();
	ctx.moveTo(W * 0.08, H * 0.6);
	ctx.lineTo(W * 0.4, H * 0.5);
	ctx.lineTo(W * 0.62, H * 0.36);
	ctx.stroke();
	ctx.beginPath();
	ctx.ellipse(W * 0.66, H * 0.33, 40, 28, -0.2, 0, Math.PI * 2);
	ctx.stroke();
	ctx.fillStyle = '#c0161f';
	ctx.font = `italic 700 26px "Marker Felt", "Comic Sans MS", cursive`;
	ctx.fillText('412 Elm — Engine 7', W * 0.46, H * 0.14);
};

// ---------- street, building, smoke ----------
const WIN = {x: 1.5, y: 6.6, z: -1.9};

const Smoke: React.FC<{f: number; dense: number}> = ({f, dense}) => {
	const puffs = [];
	const n = Math.round(26 + dense * 22);
	for (let i = 0; i < n; i++) {
		const life = 70;
		const age = ((f + (i * life) / n) % life) / life;
		const sx = (hash(i) - 0.3) * 1.6;
		const r = 0.45 + age * 1.8;
		puffs.push(
			<mesh key={i} position={[WIN.x + sx + age * 2.4, WIN.y + 0.7 + age * 7.5, WIN.z + 0.4 + hash(i + 5) * 0.8]} scale={r}>
				<icosahedronGeometry args={[1, 0]} />
				<meshLambertMaterial color={hash(i + 9) > 0.5 ? '#3d3a3a' : '#5a5656'} transparent opacity={0.55 * (1 - age)} depthWrite={false} flatShading />
			</mesh>,
		);
	}
	return <>{puffs}</>;
};

const Street: React.FC<{f: number; person?: boolean; dense?: number}> = ({f, person, dense = 0}) => {
	const flicker = 0.75 + 0.25 * Math.sin(f * 0.9) * Math.sin(f * 0.37 + 1);
	const windows = [];
	for (let cx = 0; cx < 5; cx++) {
		for (let ry = 0; ry < 5; ry++) {
			const x = -4.5 + cx * 2.5;
			const y = 1.8 + ry * 2.4;
			if (Math.abs(x - WIN.x) < 0.1 && Math.abs(y - WIN.y) < 0.1) continue;
			const lit = hash(cx * 7 + ry) > 0.55;
			windows.push(<B key={`${cx}-${ry}`} p={[x, y, -1.98]} s={[1.3, 1.4, 0.05]} c={lit ? '#ffd27a' : '#232a38'} basic={lit} />);
		}
	}
	return (
		<>
			<Env bg="#141a2e" fog={['#1a1f33', 14, 85]} />
			<hemisphereLight args={['#5a6a9a', '#2a2420', 1.0]} />
			<ambientLight intensity={0.3} />
			<directionalLight color="#9fb4ff" intensity={0.5} position={[-10, 20, 15]} />
			<pointLight position={[WIN.x, WIN.y, WIN.z + 1.5]} intensity={28 * flicker} distance={18} decay={1.4} color="#ff7a2a" />
			<B p={[0, -0.05, 6]} s={[90, 0.1, 30]} c="#2a2a2e" />
			<B p={[0, 0.07, 0.5]} s={[90, 0.14, 4]} c="#5c5a57" />
			{[-30, -18, -6, 6, 18, 30].map((x) => (
				<B key={x} p={[x, 0.02, 6]} s={[3, 0.02, 0.15]} c="#d9c45a" basic />
			))}
			{/* apartment building */}
			<B p={[0, 7, -6]} s={[14, 14, 8]} c="#b39f84" />
			<B p={[0, 14.2, -6]} s={[14.4, 0.4, 8.4]} c="#8a7a64" />
			{windows}
			<B p={[-16, 5, -6]} s={[14, 10, 8]} c="#7d8a96" />
			<B p={[16, 9, -6]} s={[14, 18, 8]} c="#8f8578" />
			{/* the burning window */}
			<B p={[WIN.x, WIN.y, -1.99]} s={[1.3, 1.4, 0.04]} c="#ff8a2a" e="#ff6a10" ei={1.4 * flicker} />
			{person ? (
				<Person shirt="#d9d4c8" hair="#2a1d16" hairStyle="long" skin="#c58c66" p={[WIN.x, WIN.y - 1.6, -1.93]} arms="wave" armBlend={0.6 + 0.4 * Math.abs(Math.sin(f * 0.35))} shadow={false} />
			) : null}
			<B p={[WIN.x, WIN.y - 1.3, -1.86]} s={[1.6, 1.3, 0.14]} c="#b39f84" />
			<B p={[WIN.x, WIN.y - 0.68, -1.82]} s={[1.6, 0.1, 0.25]} c="#8a7a64" />
			<Smoke f={f} dense={dense} />
			{/* street lights */}
			{[-12, 8].map((x) => (
				<group key={x}>
					<Cyl p={[x, 2.5, 2.2]} rt={0.07} h={5} c="#333" />
					<B p={[x, 5, 2.6]} s={[0.4, 0.12, 0.8]} c="#ffe8b0" basic />
					<pointLight position={[x, 4.6, 2.8]} intensity={10} distance={12} color="#ffd9a0" />
				</group>
			))}
		</>
	);
};

const FireEngine: React.FC<{x: number; f: number}> = ({x, f}) => {
	const on = f % 8 < 4;
	return (
		<group position={[x, 0, 5]} rotation={[0, Math.PI / 2, 0]}>
			<B p={[0, 1.3, 2.7]} s={[2.4, 2.2, 2.0]} c="#c3161c" />
			<B p={[0, 1.75, 3.71]} s={[2.1, 0.8, 0.04]} c="#1d2a36" />
			<B p={[0, 1.45, -1.0]} s={[2.4, 2.3, 5.4]} c="#c3161c" />
			<B p={[0, 1.05, -1.0]} s={[2.42, 0.18, 7.4]} c="#f2f2ee" />
			<B p={[0, 2.75, -1.2]} s={[0.7, 0.18, 6.4]} c="#b8bcc2" />
			<B p={[-0.7, 2.6, 2.9]} s={[0.6, 0.18, 0.3]} c="#ff2020" e="#ff2020" ei={on ? 2 : 0.2} />
			<B p={[0.7, 2.6, 2.9]} s={[0.6, 0.18, 0.3]} c="#ffffff" e="#ffffff" ei={on ? 0.2 : 2} />
			<B p={[0, 2.6, 2.9]} s={[0.5, 0.18, 0.3]} c="#ff2020" e="#ff2020" ei={on ? 0.2 : 2} />
			{[0.8, -0.8].map((lx) => (
				<B key={lx} p={[lx, 0.85, 3.71]} s={[0.4, 0.22, 0.04]} c="#fff7da" e="#fff2c8" ei={1} />
			))}
			{[2.6, -0.8, -2.8].map((z) =>
				[1.15, -1.15].map((wx) => <Cyl key={`${z}${wx}`} p={[wx, 0.5, z]} r={[0, 0, Math.PI / 2]} rt={0.5} h={0.3} c="#151517" />),
			)}
			<pointLight position={[0, 3.2, 3.2]} intensity={on ? 14 : 4} distance={14} color={on ? '#ff2a2a' : '#ffffff'} />
		</group>
	);
};

// ---------- dispatch center ----------
const DISPATCHER = {shirt: '#2f3f5a', pants: '#2a2c33', hair: '#1b1411', hairStyle: 'bun' as const, skin: '#a8714f'};

const Dispatch: React.FC<{f: number; map: boolean; children?: React.ReactNode}> = ({f, map, children}) => (
	<>
		<Env bg="#151820" fog={['#151820', 5, 18]} />
		<hemisphereLight args={['#8090b0', '#2a2a30', 1.1]} />
		<ambientLight intensity={0.25} />
		<pointLight position={[0.3, 2.6, 0.8]} intensity={6} distance={6} color="#dfe6ff" />
		<B p={[0, -0.05, 0]} s={[8, 0.1, 8]} c="#2c2f36" />
		<B p={[0, 1.6, -1.4]} s={[8, 3.3, 0.1]} c="#2a3040" />
		<Desk p={[0, 0, 0]} c="#3a3f4a" />
		<Monitor p={[0, 1.1, -0.22]} draw={routingScreen} res={512} />
		<Monitor p={[-0.68, 1.1, -0.08]} yaw={0.45} draw={callQueue(f)} res={320} />
		<Monitor p={[0.68, 1.1, -0.08]} yaw={-0.45} draw={callQueue(f + 8)} res={320} />
		<Chair p={[0, 0, 0.62]} yaw={Math.PI} />
		<Person
			{...DISPATCHER}
			p={[0, 0, 0.62]}
			yaw={Math.PI}
			pose="sit"
			arms={map ? 'phone' : 'type'}
			headPitch={map ? 0.45 : 0.05}
			hold={map ? <B s={[0.06, 0.16, 0.04]} c="#1d1d1f" /> : undefined}
		/>
		{/* headset */}
		<B p={[0.15, 1.27, 0.62]} s={[0.04, 0.09, 0.07]} c="#111" />
		{map ? (
			<group position={[0.48, 0.762, 0.22]} rotation={[-Math.PI / 2, 0, 0.18]}>
				<Screen w={0.62} h={0.44} res={520} draw={paperMap} />
			</group>
		) : null}
		{children}
	</>
);

// 150 frames: smoke and someone at the window, frozen routing, paper map + radio, engine arrives
export const Fire: React.FC<{f: number}> = ({f}) => {
	if (f < 38) {
		return (
			<>
				<Street f={f} person dense={0} />
				<Cam p={lerp3([-4.5, 1.6, 17], [-4.0, 1.7, 15.5], ramp(f, 0, 38))} t={[1.2, 6.8, -2]} fov={50} />
			</>
		);
	}
	if (f < 75) {
		return (
			<Dispatch f={f} map={false}>
				<Cam p={lerp3([0.62, 1.5, 1.6], [0.56, 1.46, 1.42], ramp(f, 38, 75))} t={[0, 1.08, -0.22]} fov={40} />
			</Dispatch>
		);
	}
	if (f < 112) {
		return (
			<Dispatch f={f} map>
				<Cam p={lerp3([1.0, 1.5, 0.95], [0.92, 1.45, 0.88], ramp(f, 75, 112))} t={[0.32, 0.86, 0.25]} fov={50} />
			</Dispatch>
		);
	}
	const u = smooth(ramp(f, 112, 146));
	return (
		<>
			<Street f={f} dense={1} />
			<FireEngine x={lerp(-34, -3, u)} f={f} />
			<Cam p={[14, 1.8, 22]} t={[-6, 4.5, -1]} fov={60} />
		</>
	);
};
