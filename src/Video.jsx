import { 
  AbsoluteFill, 
  Audio, 
  Sequence, 
  useCurrentFrame, 
  useVideoConfig,
  interpolate
} from 'remotion';

export const VideoShort = ({ videoData }) => {
  const { fps } = useVideoConfig();
  
  const { videoAssets = [], audioBase64, channelName = 'YourChannel' } = videoData;
  
  // Calculate scenes
  let currentFrame = 0;
  const scenes = videoAssets.map((asset) => {
    const durationInFrames = Math.floor(asset.duration * fps);
    const sceneData = {
      ...asset,
      from: currentFrame,
      durationInFrames
    };
    currentFrame += durationInFrames;
    return sceneData;
  });

  const totalDuration = currentFrame;

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      {audioBase64 && (
        <Audio src={`data:audio/mp3;base64,${audioBase64}`} />
      )}
      
      {scenes.map((scene, index) => (
        <Sequence
          key={index}
          from={scene.from}
          durationInFrames={scene.durationInFrames}
        >
          <Scene scene={scene} sceneIndex={index} />
        </Sequence>
      ))}
      
      {totalDuration > 0 && (
        <Sequence from={Math.max(0, totalDuration - (fps * 3))} durationInFrames={fps * 3}>
          <Branding channelName={channelName} />
        </Sequence>
      )}
    </AbsoluteFill>
  );
};

const Scene = ({ scene, sceneIndex }) => {
  const frame = useCurrentFrame();
  
  const scale = interpolate(
    frame,
    [0, 30, scene.durationInFrames - 30, scene.durationInFrames],
    [1, 1.08, 1.08, 1.12],
    { extrapolateRight: 'clamp' }
  );
  
  const textOpacity = interpolate(
    frame,
    [0, 15, scene.durationInFrames - 15, scene.durationInFrames],
    [0, 1, 1, 0.7],
    { extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ overflow: 'hidden' }}>
        <div style={{ transform: `scale(${scale})`, width: '100%', height: '100%' }}>
          {scene.url && (
            <video
              src={scene.url}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              muted
              playsInline
              loop
            />
          )}
        </div>
      </AbsoluteFill>
      
      <AbsoluteFill
        style={{
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.4), rgba(0,0,0,0.6))',
        }}
      />
      
      <AbsoluteFill
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          padding: '60px 40px',
        }}
      >
        <div
          style={{
            fontFamily: 'Arial, Helvetica, sans-serif',
            fontSize: sceneIndex === 0 ? 56 : 48,
            fontWeight: 'bold',
            color: 'white',
            textAlign: 'center',
            textShadow: '0 6px 24px rgba(0,0,0,0.9)',
            maxWidth: '90%',
            lineHeight: 1.3,
            opacity: textOpacity,
            textTransform: 'uppercase',
            letterSpacing: '1.5px',
          }}
        >
          {scene.text}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Branding = ({ channelName }) => {
  const frame = useCurrentFrame();
  
  const opacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });
  const scale = interpolate(frame, [0, 20], [0.7, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: 120,
        opacity,
      }}
    >
      <div
        style={{
          fontFamily: 'Arial, sans-serif',
          fontSize: 36,
          fontWeight: '700',
          color: 'white',
          backgroundColor: 'rgba(0,0,0,0.75)',
          padding: '20px 40px',
          borderRadius: 60,
          transform: `scale(${scale})`,
          backdropFilter: 'blur(10px)',
        }}
      >
        @{channelName}
      </div>
    </AbsoluteFill>
  );
};
