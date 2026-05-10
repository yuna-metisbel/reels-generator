import React from 'react';
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from 'remotion';

const FONT_FAMILY =
  '-apple-system, BlinkMacSystemFont, "Hiragino Kaku Gothic ProN", "Hiragino Sans", Meiryo, sans-serif';

const AnimatedSubtitle: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();

  const opacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const translateY = interpolate(frame, [0, 15], [40, 0], {
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        padding: '0 60px',
      }}
    >
      <div
        style={{
          opacity,
          transform: `translateY(${translateY}px)`,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          padding: '24px 48px',
          borderRadius: 16,
        }}
      >
        <p
          style={{
            color: 'white',
            fontSize: 56,
            fontWeight: 700,
            textAlign: 'center',
            lineHeight: 1.5,
            margin: 0,
            fontFamily: FONT_FAMILY,
          }}
        >
          {text}
        </p>
      </div>
    </AbsoluteFill>
  );
};

export interface ShortVideoProps {
  title: string;
  screenTexts: string[];
  durationInSeconds: number;
}

export const ShortVideo: React.FC<ShortVideoProps> = ({
  title,
  screenTexts,
  durationInSeconds,
}) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();

  const totalFrames = durationInSeconds * fps;
  const titleDuration = Math.min(fps * 3, totalFrames);
  const remainingFrames = totalFrames - titleDuration;
  const textsToShow = screenTexts.length > 0 ? screenTexts : [title];
  const framesPerText = Math.max(1, Math.floor(remainingFrames / textsToShow.length));

  const titleOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const titleScale = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 200 },
  });

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      <Sequence from={0} durationInFrames={titleDuration}>
        <AbsoluteFill
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            padding: '0 80px',
          }}
        >
          <h1
            style={{
              color: 'white',
              fontSize: 76,
              fontWeight: 900,
              textAlign: 'center',
              opacity: titleOpacity,
              transform: `scale(${titleScale})`,
              lineHeight: 1.3,
              fontFamily: FONT_FAMILY,
            }}
          >
            {title}
          </h1>
        </AbsoluteFill>
      </Sequence>

      {textsToShow.map((text, index) => (
        <Sequence
          key={index}
          from={titleDuration + index * framesPerText}
          durationInFrames={framesPerText}
        >
          <AnimatedSubtitle text={text} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
