import { 
  AbsoluteFill, 
  Audio, 
  Sequence, 
  useCurrentFrame, 
  useVideoConfig,
  interpolate,
  Img
} from 'remotion';

// Main Video Component
export const VideoShort = ({ videoData }) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  
  const { videoAssets, audioBase64, channelName } = videoData;
  
  // Calculate frame ranges for each scene
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
      {/* Audio Layer */}
      {audioBase64 && (
        <Audio src={`data:audio/mp3;base64,${audioBase64}`} />
      )}
      
      {/* Video Scenes */}
      {scenes.map((scene, index) => (
        <Sequence
          key={index}
          from={scene.from}
          durationInFrames={scene.durationInFrames}
        >
          <Scene scene={scene} sceneIndex={index} />
        </Sequence>
      ))}
      
      {/* Channel Branding (last 3 seconds) */}
      {totalDuration > 0 && (
        <Sequence from={totalDuration - (fps * 3)} durationInFrames={fps * 3}>
          <Branding channelName={channelName} />
        </Sequence>
      )}
    </AbsoluteFill>
  );
};

// Individual Scene Component
const Scene = ({ scene, sceneIndex }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  
  // Ken Burns effect (slow zoom)
  const scale = interpolate(
    frame,
    [0, 30, scene.durationInFrames - 30, scene.durationInFrames],
    [1, 1.08, 1.08, 1.12],
    { extrapolateRight: 'clamp' }
  );
  
  // Text animations
  const textOpacity = interpolate(
    frame,
    [0, 15, scene.durationInFrames - 15, scene.durationInFrames],
    [0, 1, 1, 0.7],
    { extrapolateRight: 'clamp' }
  );

  const textScale = interpolate(
    frame,
    [0, 20],
    [0.8, 1],
    { extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill>
      {/* Background Video Clip */}
      <AbsoluteFill style={{ overflow: 'hidden' }}>
        <div
          style={{
            transform: `scale(${scale})`,
            width: '100%',
            height: '100%',
          }}
        >
          {scene.url && (
            <video
              src={scene.url}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
              muted
              playsInline
              loop
            />
          )}
        </div>
      </AbsoluteFill>
      
      {/* Gradient Overlay for Text Readability */}
      <AbsoluteFill
        style={{
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.6) 100%)',
        }}
      />
      
      {/* Text Overlay */}
      <AbsoluteFill
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          padding: '60px 40px',
        }}
      >
        <div
          style={{
            fontFamily: 'Arial, sans-serif',
            fontSize: sceneIndex === 0 ? 56 : 48,
            fontWeight: 'bold',
            color: 'white',
            textAlign: 'center',
            textShadow: '0 6px 24px rgba(0,0,0,0.9), 0 2px 6px rgba(0,0,0,1)',
            maxWidth: '90%',
            lineHeight: 1.3,
            opacity: textOpacity,
            transform: `scale(${textScale})`,
            textTransform: 'uppercase',
            letterSpacing: '1.5px',
            wordWrap: 'break-word',
          }}
        >
          {scene.text}
        </div>
      </AbsoluteFill>

      {/* Scene Progress Indicator (optional) */}
      <AbsoluteFill
        style={{
          justifyContent: 'flex-end',
          alignItems: 'center',
          paddingBottom: 40,
        }}
      >
        <div
          style={{
            width: '80%',
            height: 4,
            backgroundColor: 'rgba(255,255,255,0.2)',
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${(frame / scene.durationInFrames) * 100}%`,
              height: '100%',
              backgroundColor: 'rgba(255,255,255,0.9)',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// Channel Branding Component
const Branding = ({ channelName }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const opacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: 'clamp',
  });
  
  const scale = interpolate(frame, [0, 20], [0.7, 1], {
    extrapolateRight: 'clamp',
  });

  const yPosition = interpolate(frame, [0, 20], [50, 0], {
    extrapolateRight: 'clamp',
  });

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
          transform: `scale(${scale}) translateY(${yPosition}px)`,
          backdropFilter: 'blur(10px)',
          border: '2px solid rgba(255,255,255,0.1)',
          textShadow: '0 2px 10px rgba(0,0,0,0.5)',
        }}
      >
        @{channelName}
      </div>
      
      {/* Subscribe CTA */}
      <div
        style={{
          marginTop: 20,
          fontFamily: 'Arial, sans-serif',
          fontSize: 24,
          fontWeight: '600',
          color: 'white',
          opacity: opacity * 0.9,
          textShadow: '0 2px 8px rgba(0,0,0,0.8)',
        }}
      >
        Subscribe for more 🔔
      </div>
    </AbsoluteFill>
  );
};
