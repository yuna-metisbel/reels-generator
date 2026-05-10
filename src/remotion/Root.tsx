import React from 'react';
import { Composition } from 'remotion';
import { ShortVideo, type ShortVideoProps } from './ShortVideo';

export const RemotionRoot: React.FC = () => {
  const defaultProps: ShortVideoProps = {
    title: 'サンプルタイトル',
    screenTexts: ['テキスト1', 'テキスト2', 'テキスト3'],
    durationInSeconds: 30,
  };

  return (
    <Composition
      id="ShortVideo"
      component={ShortVideo as any}
      durationInFrames={30 * 30}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={defaultProps as any}
      calculateMetadata={async ({ props }: { props: any }) => ({
        durationInFrames: (props as ShortVideoProps).durationInSeconds * 30,
      })}
    />
  );
};
