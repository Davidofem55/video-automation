import { Composition } from 'remotion';
import { VideoShort } from './compositions/VideoShort';

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="VideoShort"
        component={VideoShort}
        durationInFrames={3600}
        fps={60}
        width={1080}
        height={1920}
        defaultProps={{
          videoData: {
            title: 'Sample Video',
            channelName: 'YourChannel',
            videoAssets: [],
            audioBase64: '',
            scenes: []
          }
        }}
      />
    </>
  );
};
