import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'Server is running!',
    service: 'video-automation',
    version: '2.0.0',
    phase: 'Phase 2C - Video Rendering Active',
    endpoints: {
      health: '/health',
      render: '/render (POST)'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'video-automation-server',
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    env: process.env.NODE_ENV || 'development',
    remotionReady: true
  });
});

// Main render endpoint
app.post('/render', async (req, res) => {
  const startTime = Date.now();
  let bundledPath = null;
  let outputPath = null;

  try {
    const { videoData } = req.body;
    
    if (!videoData) {
      return res.status(400).json({ 
        error: 'videoData is required',
        received: req.body 
      });
    }

    console.log('🎬 Starting video render for:', videoData.videoId || 'unknown');
    console.log('📊 Video assets:', videoData.videoAssets?.length || 0);
    
    // Step 1: Bundle Remotion project
    console.log('📦 Step 1/3: Bundling Remotion project...');
    const remotionRoot = path.join(__dirname, 'remotion', 'index.js');
    
    bundledPath = await bundle({
      entryPoint: remotionRoot,
      webpackOverride: (config) => config,
    });
    
    console.log('✅ Bundle created at:', bundledPath);

    // Step 2: Select composition
    console.log('🎨 Step 2/3: Loading composition...');
    const composition = await selectComposition({
      serveUrl: bundledPath,
      id: 'VideoShort',
      inputProps: { videoData },
    });
    
    console.log('✅ Composition loaded:', composition.id);
    console.log('📐 Dimensions:', `${composition.width}x${composition.height}`);
    console.log('⏱️  Duration:', `${composition.durationInFrames} frames at ${composition.fps} fps`);

    // Step 3: Render video
    console.log('🎥 Step 3/3: Rendering video...');
    const outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const videoId = videoData.videoId || `video_${Date.now()}`;
    outputPath = path.join(outputDir, `${videoId}.mp4`);

    await renderMedia({
      composition,
      serveUrl: bundledPath,
      codec: 'h264',
      outputLocation: outputPath,
      inputProps: { videoData },
      onProgress: ({ progress }) => {
        const percent = Math.round(progress * 100);
        if (percent % 10 === 0) {
          console.log(`🎬 Rendering: ${percent}%`);
        }
      },
    });

    const renderTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ Video rendered successfully in ${renderTime}s`);
    console.log(`📁 Output: ${outputPath}`);

    // Return success response
    res.json({
      status: 'success',
      message: 'Video rendered successfully!',
      videoId: videoId,
      outputPath: outputPath,
      renderTime: `${renderTime}s`,
      composition: {
        width: composition.width,
        height: composition.height,
        fps: composition.fps,
        durationInFrames: composition.durationInFrames,
        durationInSeconds: (composition.durationInFrames / composition.fps).toFixed(2)
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Render error:', error);
    
    res.status(500).json({ 
      error: 'Video rendering failed',
      message: error.message,
      stack: process.env.NODE_ENV === 'production' ? undefined : error.stack,
      renderTime: `${((Date.now() - startTime) / 1000).toFixed(2)}s`
    });
  } finally {
    // Cleanup: Remove bundled files (but keep rendered video)
    if (bundledPath) {
      try {
        fs.rmSync(bundledPath, { recursive: true, force: true });
        console.log('🧹 Cleaned up bundle files');
      } catch (cleanupError) {
        console.warn('⚠️  Cleanup warning:', cleanupError.message);
      }
    }
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
    availableEndpoints: ['/', '/health', '/render (POST)']
  });
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log('═══════════════════════════════════════');
  console.log('🚀 Video Automation Server - Phase 2C');
  console.log('═══════════════════════════════════════');
  console.log(`📡 Server:  http://localhost:${PORT}`);
  console.log(`✅ Health:  http://localhost:${PORT}/health`);
  console.log(`🎬 Render:  http://localhost:${PORT}/render`);
  console.log(`🔢 Node:    ${process.version}`);
  console.log(`🌍 Env:     ${process.env.NODE_ENV || 'development'}`);
  console.log('═══════════════════════════════════════');
  console.log('✨ Video rendering is ACTIVE!');
  console.log('═══════════════════════════════════════');
});
