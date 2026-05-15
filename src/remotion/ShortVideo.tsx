import React from 'react';
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
} from 'remotion';
import type { VideoMood } from '@/types';

const FONT_FAMILY =
  '-apple-system, BlinkMacSystemFont, "Hiragino Kaku Gothic ProN", "Hiragino Sans", Meiryo, sans-serif';

const MOOD_BACKGROUNDS: Record<VideoMood, string> = {
  emotional: 'linear-gradient(135deg, #1a0533 0%, #2d1b69 50%, #0f0a1a 100%)',
  dark: 'linear-gradient(180deg, #0a0a0a 0%, #1a1a2e 50%, #000000 100%)',
  cool: 'linear-gradient(135deg, #0a1628 0%, #1a2a5e 50%, #0d1117 100%)',
  funny: 'linear-gradient(135deg, #1a0f00 0%, #3d2200 50%, #1a1000 100%)',
  cute: 'linear-gradient(135deg, #1a0a1a 0%, #4a1942 50%, #200a20 100%)',
  serious: 'linear-gradient(135deg, #1a0000 0%, #4a0a0a 50%, #0a0000 100%)',
};

const FadeInText: React.FC<{ text: string; fontSize?: number }> = ({
  text,
  fontSize = 52,
}) => {
  const frame = useCurrentFrame();

  const opacity = interpolate(frame, [0, 12], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const translateY = interpolate(frame, [0, 12], [30, 0], {
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        padding: '0 80px',
      }}
    >
      <p
        style={{
          color: 'white',
          fontSize,
          fontWeight: 700,
          textAlign: 'center',
          lineHeight: 1.6,
          margin: 0,
          fontFamily: FONT_FAMILY,
          opacity,
          transform: `translateY(${translateY}px)`,
          textShadow: '0 2px 20px rgba(0,0,0,0.8)',
        }}
      >
        {text}
      </p>
    </AbsoluteFill>
  );
};

export interface ShortVideoProps {
  title: string;
  screenTexts: string[];
  durationInSeconds: number;
  mood?: VideoMood;
}

export const ShortVideo: React.FC<ShortVideoProps> = ({
  screenTexts,
  durationInSeconds,
  mood = 'emotional',
}) => {
  const { fps } = useVideoConfig();

  const totalFrames = durationInSeconds * fps;
  const texts = screenTexts.filter(t => t.trim().length > 0);
  const framesPerText = Math.max(1, Math.floor(totalFrames / Math.max(1, texts.length)));

  return (
    <AbsoluteFill style={{ background: MOOD_BACKGROUNDS[mood] }}>
      {texts.map((text, index) => {
        const isFirst = index === 0;
        const isLast = index === texts.length - 1;
        const size = isFirst || isLast ? 58 : 52;

        return (
          <Sequence
            key={index}
            from={index * framesPerText}
            durationInFrames={framesPerText}
          >
            <FadeInText text={text} fontSize={size} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
