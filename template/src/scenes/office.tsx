// Demo scenes: an office worker at a desk vanishes on zero, then alerts pile up on the monitor.
// Replace these with your own story; the building blocks live in ../three.
import React from 'react';
import {B, Burst, Cam, Env, Lights} from '../three/core';
import {Chair, Desk, Monitor, Person, PersonProps} from '../three/prims';
import {alertScreen, codeScreen} from '../screens';
import {lerp3, ramp} from '../lib';

const WORKER: PersonProps = {shirt: '#2f3d66', hair: '#3a2a20', skin: '#d4a684'};

const Office: React.FC<{hero: (ctx: CanvasRenderingContext2D, W: number, H: number) => void; worker: boolean; children?: React.ReactNode}> = ({
	hero,
	worker,
	children,
}) => (
	<>
		<Env bg="#d8dde0" fog={['#dfe2e2', 8, 30]} />
		<Lights sky="#f6f6f2" ground="#7a746c" hemi={1.5} sun="#fff6e8" sunI={1.1} sunP={[3, 6, -20]} />
		<B p={[0, -0.05, -2]} s={[14, 0.1, 12]} c="#7d8288" />
		<B p={[0, 1.65, -6]} s={[14, 3.5, 0.1]} c="#dedbd4" />
		<B p={[0, 1.7, -5.94]} s={[10, 2.2, 0.02]} c="#bcd3e6" basic />
		{[-2.2, 2.2].map((x) => (
			<group key={x}>
				<Desk p={[x, 0, -2.6]} />
				<Monitor p={[x, 1.1, -2.82]} draw={codeScreen} res={256} />
				<Chair p={[x, 0, -1.98]} yaw={Math.PI} />
			</group>
		))}
		<Desk p={[0, 0, 0]} />
		<Monitor p={[0, 1.1, -0.22]} draw={hero} res={640} />
		<Chair p={[0, 0, 0.62]} yaw={Math.PI} />
		{worker ? <Person {...WORKER} p={[0, 0, 0.62]} yaw={Math.PI} pose="sit" arms="type" /> : null}
		{children}
	</>
);

export const Countdown: React.FC<{f: number}> = ({f}) => (
	<Office hero={codeScreen} worker>
		<Cam p={lerp3([1.6, 1.6, 2.9], [1.2, 1.5, 2.3], ramp(f, 0, 120))} t={[0, 1.05, -0.2]} fov={50} />
	</Office>
);

export const Vanish: React.FC<{f: number}> = ({f}) => (
	<Office hero={codeScreen} worker={f < 0}>
		<Burst p={[0, 1.15, 0.62]} f={f} start={0} len={14} color="#ffffff" n={22} spread={0.6} size={0.05} />
		<Cam p={lerp3([1.2, 1.5, 2.3], [1.0, 1.45, 2.0], ramp(f, 0, 75))} t={[0, 1.0, 0.2]} fov={50} />
	</Office>
);

export const Alerts: React.FC<{f: number}> = ({f}) => (
	<Office hero={alertScreen(f)} worker={false}>
		<Cam p={lerp3([0.25, 1.45, 1.7], [0.2, 1.4, 1.5], ramp(f, 0, 105))} t={[0, 1.08, -0.22]} fov={38} />
	</Office>
);
