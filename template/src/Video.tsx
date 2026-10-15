import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {SCENES} from './scenes';
import {beatAt, Beat, FADE_OUT} from './timeline';
import {clamp, ramp} from './lib';

const SERIF = '"Times New Roman", Georgia, serif';
const shadow = '0 2px 0 rgba(0,0,0,0.55), 0 0 18px rgba(0,0,0,0.55)';
// thin dark outline drawn under the fill so letters stay crisp on bright backgrounds
const stroke = {WebkitTextStroke: '2px rgba(0,0,0,0.55)', paintOrder: 'stroke fill'} as const;

// One scene per beat id; a beat without a registered scene renders black (handy while drafting).
const World: React.FC<{beat: Beat; f: number}> = ({beat, f}) => {
	const Scene = SCENES[beat.id];
	return Scene ? <Scene f={f} /> : null;
};

const Stats: React.FC<{beat: Beat; f: number}> = ({beat, f}) => {
	const set = [...(beat.stats ?? [])].reverse().find((s) => f >= s.from);
	if (!set) return null;
	return (
		<div style={{position: 'absolute', left: 70, top: 230, fontFamily: SERIF, color: '#fff', textShadow: shadow, ...stroke}}>
			{set.items.map(([label, value]) => (
				<div key={label} style={{marginBottom: 28}}>
					<div style={{fontSize: 30, letterSpacing: 4, textTransform: 'uppercase', opacity: 0.88}}>{label}</div>
					<div style={{fontSize: 58, lineHeight: 1.05}}>{value}</div>
				</div>
			))}
		</div>
	);
};

const Caption: React.FC<{beat: Beat; f: number}> = ({beat, f}) => {
	const cap = beat.captions?.find(([a, b]) => f >= a && f < b);
	if (!cap) return null;
	// a caption that starts at frame 0 continues from the previous beat, so it does not fade in again
	const fadeIn = cap[0] === 0 ? 1 : ramp(f, cap[0], cap[0] + 5);
	const fadeOut = cap[1] >= beat.frames ? 1 : 1 - ramp(f, cap[1] - 4, cap[1]);
	return (
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
				opacity: clamp(fadeIn * fadeOut),
			}}
		>
			{cap[2]}
		</div>
	);
};

const Chyron: React.FC<{beat: Beat; f: number}> = ({beat, f}) => {
	const c = beat.chyron;
	if (!c || f < c[0] || f >= c[1]) return null;
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

// 5-4-3-2-1 over the whole beat; the next beat starts on zero.
const Countdown: React.FC<{beat: Beat; f: number}> = ({beat, f}) => {
	if (!beat.countdown) return null;
	const step = beat.frames / 5;
	const n = Math.max(1, Math.ceil((beat.frames - f) / step));
	const into = (f % step) / step;
	const pop = 1 + 0.25 * Math.max(0, 0.25 - into) * 4;
	return (
		<div style={{position: 'absolute', top: 640, left: 60, right: 60, textAlign: 'center', fontFamily: SERIF, color: '#fff', textShadow: shadow, ...stroke}}>
			<div style={{fontSize: 44, letterSpacing: 6, textTransform: 'uppercase'}}>{beat.countdown}</div>
			<div style={{fontSize: 260, lineHeight: 1.1, transform: `scale(${pop})`}}>{n}</div>
		</div>
	);
};

export const Video: React.FC = () => {
	const g = useCurrentFrame();
	const {width, height, durationInFrames} = useVideoConfig();
	const beat = beatAt(g);
	const f = g - beat.start;
	return (
		<AbsoluteFill style={{background: '#000'}}>
			{/* dpr 0.5 renders the 3D at half resolution; pixelated upscaling gives the PS2 look */}
			<ThreeCanvas width={width} height={height} dpr={0.5} flat gl={{antialias: false, preserveDrawingBuffer: true}} style={{imageRendering: 'pixelated'}}>
				<World beat={beat} f={f} />
			</ThreeCanvas>
			<AbsoluteFill style={{pointerEvents: 'none'}}>
				<AbsoluteFill style={{background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,0.38) 100%)'}} />
				<AbsoluteFill style={{background: 'radial-gradient(ellipse 620px 360px at 160px 330px, rgba(0,0,0,0.45), rgba(0,0,0,0) 70%)'}} />
				<Stats beat={beat} f={f} />
				<Countdown beat={beat} f={f} />
				<Caption beat={beat} f={f} />
				<Chyron beat={beat} f={f} />
				<AbsoluteFill style={{background: '#000', opacity: ramp(g, durationInFrames - FADE_OUT, durationInFrames - 2)}} />
			</AbsoluteFill>
			<Audio src={staticFile('soundtrack.wav')} />
		</AbsoluteFill>
	);
};
