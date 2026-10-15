// Scene registry: beat id (beats.json) -> component that receives the beat-local frame f.
// Add a beat to beats.json, add a component here, and the timeline, overlay and sound follow.
import React from 'react';
import {Countdown, Vanish, Alerts} from './office';

export const SCENES: Record<string, React.FC<{f: number}>> = {
	countdown: Countdown,
	vanish: Vanish,
	alerts: Alerts,
};
