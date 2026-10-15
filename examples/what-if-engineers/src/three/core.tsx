import React, {useLayoutEffect, useMemo} from 'react';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import type {V3} from '../lib';

// Camera placed every frame; runs before ThreeCanvas advances the render.
export const Cam: React.FC<{p: V3; t: V3; fov?: number}> = ({p, t, fov = 55}) => {
	const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
	useLayoutEffect(() => {
		camera.position.set(p[0], p[1], p[2]);
		camera.up.set(0, 1, 0);
		camera.lookAt(t[0], t[1], t[2]);
		camera.fov = fov;
		camera.near = 0.02;
		camera.far = 6000;
		camera.updateProjectionMatrix();
	});
	return null;
};

export const Env: React.FC<{bg: string; fog?: [string, number, number]}> = ({bg, fog}) => {
	const scene = useThree((s) => s.scene);
	useLayoutEffect(() => {
		scene.background = new THREE.Color(bg);
		scene.fog = fog ? new THREE.Fog(fog[0], fog[1], fog[2]) : null;
	});
	return null;
};

type BoxProps = {
	p?: V3;
	s: V3;
	c: string;
	r?: V3;
	e?: string;
	ei?: number;
	o?: number;
	basic?: boolean;
};

export const B: React.FC<BoxProps> = ({p = [0, 0, 0], s, c, r, e, ei = 1, o, basic}) => (
	<mesh position={p} rotation={r}>
		<boxGeometry args={s} />
		{basic ? (
			<meshBasicMaterial color={c} transparent={o !== undefined} opacity={o ?? 1} toneMapped={false} />
		) : (
			<meshLambertMaterial
				color={c}
				flatShading
				emissive={e ?? '#000000'}
				emissiveIntensity={ei}
				transparent={o !== undefined}
				opacity={o ?? 1}
				depthWrite={o === undefined}
			/>
		)}
	</mesh>
);

export const Cyl: React.FC<{p?: V3; r?: V3; rt: number; rb?: number; h: number; c: string; seg?: number; e?: string; ei?: number}> = ({
	p = [0, 0, 0],
	r,
	rt,
	rb,
	h,
	c,
	seg = 8,
	e,
	ei = 1,
}) => (
	<mesh position={p} rotation={r}>
		<cylinderGeometry args={[rt, rb ?? rt, h, seg]} />
		<meshLambertMaterial color={c} flatShading emissive={e ?? '#000000'} emissiveIntensity={ei} />
	</mesh>
);

export const Blob: React.FC<{p?: V3; w: number; d: number; o?: number}> = ({p = [0, 0.01, 0], w, d, o = 0.28}) => (
	<mesh position={p} rotation={[-Math.PI / 2, 0, 0]} scale={[w, d, 1]}>
		<circleGeometry args={[0.5, 12]} />
		<meshBasicMaterial color="#000000" transparent opacity={o} depthWrite={false} />
	</mesh>
);

export type Draw = (ctx: CanvasRenderingContext2D, W: number, H: number) => void;

// A flat screen whose 2D canvas is redrawn on every render.
export const Screen: React.FC<{w: number; h: number; res?: number; draw: Draw; p?: V3; r?: V3; fog?: boolean}> = ({
	w,
	h,
	res = 512,
	draw,
	p,
	r,
	fog = true,
}) => {
	const W = res;
	const H = Math.round((res * h) / w);
	const {canvas, tex} = useMemo(() => {
		const c = document.createElement('canvas');
		c.width = W;
		c.height = H;
		const t = new THREE.CanvasTexture(c);
		t.colorSpace = THREE.SRGBColorSpace;
		t.anisotropy = 4;
		return {canvas: c, tex: t};
	}, [W, H]);
	const ctx = canvas.getContext('2d')!;
	ctx.save();
	draw(ctx, W, H);
	ctx.restore();
	tex.needsUpdate = true;
	return (
		<mesh position={p} rotation={r}>
			<planeGeometry args={[w, h]} />
			<meshBasicMaterial map={tex} toneMapped={false} fog={fog} />
		</mesh>
	);
};

// Static canvas texture, drawn once.
export const useStaticTexture = (W: number, H: number, draw: Draw, key: string) =>
	useMemo(() => {
		const c = document.createElement('canvas');
		c.width = W;
		c.height = H;
		const ctx = c.getContext('2d')!;
		draw(ctx, W, H);
		const t = new THREE.CanvasTexture(c);
		t.colorSpace = THREE.SRGBColorSpace;
		return t;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [key]);

export const Sky: React.FC<{stops: [number, string][]}> = ({stops}) => {
	const tex = useStaticTexture(
		4,
		256,
		(ctx, W, H) => {
			const g = ctx.createLinearGradient(0, 0, 0, H);
			stops.forEach(([o, c]) => g.addColorStop(o, c));
			ctx.fillStyle = g;
			ctx.fillRect(0, 0, W, H);
		},
		stops.map((s) => s.join()).join('|'),
	);
	return (
		<mesh>
			<sphereGeometry args={[4500, 16, 12]} />
			<meshBasicMaterial map={tex} side={THREE.BackSide} fog={false} toneMapped={false} />
		</mesh>
	);
};

export const Lights: React.FC<{sky?: string; ground?: string; hemi?: number; sun?: string; sunI?: number; sunP?: V3; amb?: number}> = ({
	sky = '#e4ebf2',
	ground = '#6b6255',
	hemi = 1.6,
	sun = '#ffe4bd',
	sunI = 1.8,
	sunP = [200, 160, 120],
	amb = 0.25,
}) => (
	<>
		<hemisphereLight args={[sky, ground, hemi]} />
		<ambientLight intensity={amb} />
		<directionalLight color={sun} intensity={sunI} position={sunP} />
	</>
);

// Small cubes flying outward then fading: used for the vanish and impact sparks.
export const Burst: React.FC<{p: V3; f: number; start: number; len?: number; color: string; n?: number; spread?: number; size?: number; seed?: number}> = ({
	p,
	f,
	start,
	len = 16,
	color,
	n = 18,
	spread = 0.9,
	size = 0.05,
	seed = 1,
}) => {
	const k = (f - start) / len;
	if (k < 0 || k > 1) return null;
	const items = [];
	for (let i = 0; i < n; i++) {
		const a = Math.sin(i * 12.989 + seed) * 43758.5453;
		const u = a - Math.floor(a);
		const b = Math.sin(i * 78.233 + seed * 3) * 12543.1;
		const v = b - Math.floor(b);
		const dir: V3 = [Math.cos(u * 6.283) * Math.sin(v * 3.14), Math.cos(v * 3.14) * 0.8 + 0.3, Math.sin(u * 6.283) * Math.sin(v * 3.14)];
		const d = spread * Math.sqrt(k);
		items.push(
			<B
				key={i}
				p={[p[0] + dir[0] * d, p[1] + dir[1] * d - k * k * 0.3, p[2] + dir[2] * d]}
				s={[size * (1 - k), size * (1 - k), size * (1 - k)]}
				c={color}
				basic
			/>,
		);
	}
	return <>{items}</>;
};
