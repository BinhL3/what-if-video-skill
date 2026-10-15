import React from 'react';
import {Composition} from 'remotion';
import {Video} from './Video';

export const RemotionRoot: React.FC = () => (
	<Composition id="WhatIf" component={Video} durationInFrames={2206} fps={30} width={1080} height={1920} />
);
