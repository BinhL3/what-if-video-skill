import React, {useLayoutEffect, useMemo, useRef} from 'react';
import * as THREE from 'three';
import {B, Burst, Cam, Env, Lights, Sky} from '../three/core';
import {Car, PersonProps} from '../three/prims';
import {clamp, lerp, ramp, shake, V3} from '../lib';

const ORANGE = '#b9392b';
const T1 = -320; // near tower
const T2 = -1600; // far tower
const CABLE_X = 14;

const cableY = (z: number) => {
	if (z <= T1) {
		const mid = (T1 + T2) / 2;
		const k = (z - mid) / ((T1 - T2) / 2);
		return 5 + 147 * k * k;
	}
	const k = clamp((330 - z) / (330 - T1));
	return 2 + 150 * Math.pow(k, 1.7);
};

const Instanced: React.FC<{mats: THREE.Matrix4[]; color: string; basic?: boolean}> = ({mats, color, basic}) => {
	const ref = useRef<THREE.InstancedMesh>(null);
	useLayoutEffect(() => {
		mats.forEach((m, i) => ref.current!.setMatrixAt(i, m));
		ref.current!.instanceMatrix.needsUpdate = true;
	}, [mats]);
	return (
		<instancedMesh ref={ref} args={[undefined, undefined, mats.length]}>
			<boxGeometry args={[1, 1, 1]} />
			{basic ? <meshBasicMaterial color={color} /> : <meshLambertMaterial color={color} flatShading />}
		</instancedMesh>
	);
};

const mat = (x: number, y: number, z: number, sx: number, sy: number, sz: number) =>
	new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion(), new THREE.Vector3(sx, sy, sz));

const Tower: React.FC<{z: number}> = ({z}) => (
	<group position={[0, 0, z]}>
		{[-16, 16].map((x) => (
			<group key={x} position={[x, 0, 0]}>
				<B p={[0, -20, 0]} s={[7, 100, 10]} c={ORANGE} />
				<B p={[0, 65, 0]} s={[5.8, 70, 8.6]} c={ORANGE} />
				<B p={[0, 126, 0]} s={[4.8, 52, 7.4]} c={ORANGE} />
				{[-2, 0, 2].map((dz) => (
					<B key={dz} p={[x > 0 ? 3 : -3, 70, dz * 1.2]} s={[0.5, 150, 0.6]} c="#9a2c21" />
				))}
			</group>
		))}
		{[46, 86, 120, 150].map((y, i) => (
			<group key={y}>
				<B p={[0, y, 0]} s={[28, i === 3 ? 5 : 8, 4]} c={ORANGE} />
				{[-8, -2.7, 2.7, 8].map((x) => (
					<B key={x} p={[x, y, 2.05]} s={[2.4, i === 3 ? 3 : 5.5, 0.3]} c="#982b20" />
				))}
			</group>
		))}
	</group>
);

const BridgeSet: React.FC = () => {
	const {cables, suspenders, dashes, posts} = useMemo(() => {
		const cables = [-CABLE_X, CABLE_X].map((x) => {
			const pts: THREE.Vector3[] = [];
			for (let z = 330; z >= T2 - 200; z -= 20) pts.push(new THREE.Vector3(x, z < T2 ? cableY(T1 - (z - T2)) : cableY(z), z));
			return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 260, 0.55, 5);
		});
		const suspenders: THREE.Matrix4[] = [];
		for (let z = 320; z > T2; z -= 15) {
			if (Math.abs(z - T1) < 10) continue;
			const h = cableY(z);
			[-CABLE_X, CABLE_X].forEach((x) => suspenders.push(mat(x, h / 2, z, 0.18, h, 0.18)));
		}
		const dashes: THREE.Matrix4[] = [];
		for (let z = 300; z > -500; z -= 9) {
			[0, 3.5, 7].forEach((x) => dashes.push(mat(x, 0.02, z, 0.14, 0.02, 3)));
		}
		const posts: THREE.Matrix4[] = [];
		for (let z = 300; z > -500; z -= 2) {
			[-12.5, 12.5].forEach((x) => posts.push(mat(x, 0.6, z, 0.09, 1.2, 0.09)));
		}
		return {cables, suspenders, dashes, posts};
	}, []);
	return (
		<group>
			<B p={[0, -0.5, -650]} s={[25, 1, 2700]} c="#505154" />
			<Instanced mats={dashes} color="#e8e6df" basic />
			<B p={[-3.5, 0.42, -650]} s={[0.45, 0.84, 2700]} c="#d1bb55" />
			<B p={[-3.5, 0.18, -650]} s={[0.9, 0.36, 2700]} c="#b9b49f" />
			{[-11.5, 11.5].map((x) => (
				<B key={x} p={[x, 0.12, -650]} s={[2, 0.24, 2700]} c="#8f8c86" />
			))}
			{[-12.5, 12.5].map((x) => (
				<group key={x}>
					<B p={[x, 1.2, -650]} s={[0.14, 0.12, 2700]} c={ORANGE} />
					<B p={[x, 0.65, -650]} s={[0.08, 0.06, 2700]} c={ORANGE} />
					<B p={[x * 1.01, -3.5, -650]} s={[0.4, 7, 2700]} c="#9c3125" />
				</group>
			))}
			<Instanced mats={posts} color={ORANGE} />
			<Instanced mats={suspenders} color={ORANGE} />
			{cables.map((g, i) => (
				<mesh key={i} geometry={g}>
					<meshLambertMaterial color={ORANGE} flatShading />
				</mesh>
			))}
			<Tower z={T1} />
			<Tower z={T2} />
			<mesh position={[0, -67, -800]} rotation={[-Math.PI / 2, 0, 0]}>
				<planeGeometry args={[8000, 8000]} />
				<meshLambertMaterial color="#6f8796" />
			</mesh>
			{[
				[-900, -2300, 380, 260],
				[-300, -2600, 520, 300],
				[500, -2400, 460, 240],
				[1100, -2100, 420, 200],
			].map(([x, z, r, h], i) => (
				<mesh key={i} position={[x, h / 2 - 67, z]}>
					<coneGeometry args={[r, h, 6]} />
					<meshLambertMaterial color="#7c8a6a" flatShading />
				</mesh>
			))}
		</group>
	);
};

const BridgeWorld: React.FC = () => (
	<>
		<Env bg="#b4cce4" fog={['#b4cce4', 25, 1900]} />
		<Sky
			stops={[
				[0, '#3f84d4'],
				[0.4, '#7fb2e2'],
				[0.5, '#bcd4ea'],
				[1, '#b9c9d6'],
			]}
		/>
		<Lights />
		<BridgeSet />
	</>
);

// ---------- crash choreography (t in seconds from 8:00:00) ----------
const decel = (dt: number, v: number, T: number) => {
	const u = clamp(dt / T);
	return v * T * (u - (u * u) / 2);
};
type Ve = {x: number; z: number; yaw: number; brake: number; pitch: number};
const IMPACT = 2.2;
const engineer = (t: number): Ve => {
	if (t < IMPACT) {
		const u = ramp(t, 0.7, IMPACT);
		return {x: 1.75 + 1.65 * u * u, z: 13 * t, yaw: 0.2 * u, brake: 0, pitch: 0};
	}
	const u = ramp(t, IMPACT, IMPACT + 0.9);
	return {x: lerp(3.4, 3.0, u), z: 13 * IMPACT + decel(t - IMPACT, 13, 0.9), yaw: lerp(0.2, 0.45, Math.sqrt(u)), brake: 0, pitch: 0.03 * (1 - u)};
};
const hitCar = (t: number): Ve => {
	if (t < IMPACT) return {x: 5.25, z: 13 * t + 2.2, yaw: 0, brake: 0, pitch: 0};
	const u = ramp(t, IMPACT, IMPACT + 1.2);
	return {x: lerp(5.25, 6.6, Math.sqrt(u)), z: 13 * IMPACT + 2.2 + decel(t - IMPACT, 13, 1.2), yaw: lerp(0, -0.3, Math.sqrt(u)), brake: 1, pitch: 0.035 * Math.sin(u * 3.14)};
};
const braker = (x: number, z0: number, tb: number, T: number, wob = 0): ((t: number) => Ve) => (t) => {
	if (t < tb) return {x, z: z0 + 13 * t, yaw: 0, brake: 0, pitch: 0};
	const u = ramp(t, tb, tb + T);
	return {x, z: z0 + 13 * tb + decel(t - tb, 13, T), yaw: wob * Math.sin(u * 3.14), brake: 1, pitch: 0.04 * Math.sin(u * 3.14)};
};
const waymoZ = (t: number) => {
	const z0 = -13;
	if (t < 3.2) return z0 + 12 * t;
	if (t < 4) {
		const u = (t - 3.2) / 0.8;
		return z0 + 38.4 + 0.8 * (12 * u - 3 * u * u);
	}
	if (t < 5) return z0 + 45.6 + 6 * (t - 4);
	if (t < 6) {
		const u = t - 5;
		return z0 + 51.6 + 6 * u + 3 * u * u;
	}
	return z0 + 60.6 + 12 * (t - 6);
};
const cruiser = (x: number, z0: number, v: number) => (t: number): Ve => ({x, z: z0 + v * t, yaw: v < 0 ? Math.PI : 0, brake: 0, pitch: 0});

const ENGINEER: PersonProps = {shirt: '#2f3d66', hair: '#3a2a20', skin: '#d4a684'};
const PASSENGERS: PersonProps[] = [
	{shirt: '#a3473b', hair: '#1c1714', hairStyle: 'long', skin: '#b98563'},
	{shirt: '#4f6b4a', hair: '#5b3a22', skin: '#e0b79a'},
];

const traffic = [
	{f: braker(1.75, -20, 2.35, 1.6), c: '#8c8f94'},
	{f: braker(8.75, -6, 2.3, 1.1, 0.12), c: '#2c4a6e'},
	{f: braker(5.25, -30, 2.5, 1.8), c: '#d8d4c8'},
	{f: braker(8.75, -34, 2.6, 2.0), c: '#5d2f2f'},
	{f: cruiser(8.75, 34, 13), c: '#3f5f4f'},
	{f: cruiser(5.25, 52, 13), c: '#b0a28a'},
	{f: cruiser(-5.25, 140, -12), c: '#6a6f78'},
	{f: cruiser(-8.75, 95, -13), c: '#9b3a30'},
	{f: cruiser(-5.25, 40, -12), c: '#e2e0d8'},
	{f: cruiser(-8.75, 230, -13), c: '#33373e'},
];

// Opening crash (frames 0–149), then the robotaxi continuing (150–205).
export const BridgeCrash: React.FC<{f: number}> = ({f}) => {
	const t = f / 30;
	const E = engineer(t);
	const H = hitCar(t);
	const wz = waymoZ(t);
	const wBrake = t > 3.2 && t < 5 ? 1 : 0;
	const vanish = 14;
	const driverVisible = f < vanish - 4 || (f < vanish && f % 2 === 0);
	let cam: {p: V3; t: V3; fov: number};
	if (f < 45) {
		cam = {p: [E.x + 1.0, 1.75, E.z + 4.6], t: [E.x + 0.3, 1.45, E.z], fov: 46};
	} else if (f < 95) {
		const s = shake(f, 66, 12, 0.12);
		cam = {p: [2.0 + s[0], 2.3 + s[1], 50], t: [3.5, 2.6, 20], fov: 52};
	} else if (f < 150) {
		cam = {p: [-0.2, 0.9, 52], t: [-0.9, 2.0, 30], fov: 55};
	} else {
		cam = {p: [-1.75 + 2.1, 1.7, wz + 7.5], t: [-1.75 + 0.6, 1.1, wz - 6], fov: 55};
	}
	const headYaw = f >= 150 ? 2.1 + Math.sin(f * 0.05) * 0.1 : 0.3;
	return (
		<>
			<BridgeWorld />
			<Cam {...cam} />
			<Car {...E} color="#5b6f8a" driver={ENGINEER} driverVisible={driverVisible} />
			<Car {...H} color="#c9c3b3" driver={{shirt: '#7a5a3a', hair: '#222'}} />
			{traffic.map((c, i) => (
				<Car key={i} {...c.f(t)} color={c.c} driver={{shirt: '#556', hair: '#2a2a2a'}} />
			))}
			<Car
				x={-1.75}
				z={wz}
				color="#f2f2ee"
				waymo
				brake={wBrake}
				passengers={PASSENGERS.map((p) => ({...p, headYaw}))}
			/>
			<Burst p={[E.x + 0.4, 1.25, E.z + 0.05]} f={f} start={vanish} len={14} color="#ffffff" n={22} spread={0.7} size={0.06} />
			<Burst p={[4.3, 0.9, 13 * IMPACT + 1.2]} f={f} start={66} len={12} color="#ffcf6a" n={16} spread={1.4} size={0.08} seed={4} />
			<Burst p={[4.3, 1.1, 13 * IMPACT + 1.4]} f={f} start={66} len={16} color="#cfe3ff" n={10} spread={1.1} size={0.06} seed={9} />
		</>
	);
};

// Frames 1590–1649: same opening angle, five years later, normal traffic.
export const BridgeAfter: React.FC<{f: number}> = ({f}) => {
	const t = f / 30;
	const ex = 1.75;
	const ez = 13 * t;
	const DRIVER: PersonProps = {shirt: '#b8742c', hair: '#2b1c14', hairStyle: 'bun', skin: '#a8714f'};
	return (
		<>
			<BridgeWorld />
			<Cam p={[ex + 1.0, 1.75, ez + 4.6]} t={[ex + 0.3, 1.45, ez]} fov={46} />
			<Car x={ex} z={ez} color="#5b6f8a" driver={DRIVER} />
			<Car x={-1.75} z={-9 + 13 * t} color="#f2f2ee" waymo passengers={[{shirt: '#3c6e8f', hair: '#222'}]} />
			<Car x={5.25} z={-14 + 12.5 * t} color="#c9c3b3" driver={{shirt: '#7a5a3a', hair: '#222'}} />
			<Car x={8.75} z={-30 + 13.5 * t} color="#2c4a6e" driver={{shirt: '#556', hair: '#2a2a2a'}} />
			<Car x={1.75} z={-22 + 13 * t} color="#8c8f94" driver={{shirt: '#556', hair: '#2a2a2a'}} />
			<Car x={-5.25} z={160 - 12 * t} yaw={Math.PI} color="#9b3a30" driver={{shirt: '#556', hair: '#2a2a2a'}} />
			<Car x={-8.75} z={110 - 13 * t} yaw={Math.PI} color="#e2e0d8" driver={{shirt: '#556', hair: '#2a2a2a'}} />
		</>
	);
};
