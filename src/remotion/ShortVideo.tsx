import React from 'react';
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
} from 'remotion';

const FONT_FAMILY =
  '-apple-system, BlinkMacSystemFont, "Hiragino Kaku Gothic ProN", "Hiragino Sans", Meiryo, sans-serif';

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
}

export const ShortVideo: React.FC<ShortVideoProps> = ({
  screenTexts,
  durationInSeconds,
}) => {
  const { fps } = useVideoConfig();

  const totalFrames = durationInSeconds * fps;
  const texts = screenTexts.filter(t => t.trim().length > 0);
  const framesPerText = Math.max(1, Math.floor(totalFrames / Math.max(1, texts.length)));

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
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
