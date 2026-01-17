import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import fs from 'fs';
import logger from './utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'Server is running!',
    service: 'video-automation',
    version: '2.1.0',
    phase: 'Phase 4 - Enhanced Logging',
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
    remotionReady: true,
    memoryUsage: process.memoryUsage()
  });
});

// Main render endpoint
app.post('/render', async (req, res) => {
  const startTime = Date.now();
  const requestId = `req_${Date.now()}`;
  let bundledPath = null;
  let outputPath = null;

  try {
    const { videoData } = req.body;
    
    if (!videoData) {
      logger.error('Missing videoData in request', { requestId });
      return res.status(400).json({ 
        error: 'videoData is required',
        received: req.body 
      });
    }

    logger.render('START', `New render request`, {
      requestId,
      videoId: videoData.videoId || 'unknown',
      assets: videoData.videoAssets?.length || 0,
      channelName: videoData.channelName
    });
    
    // Step 1: Bundle Remotion project
    logger.render('BUNDLE', 'Starting Remotion bundle...', { requestId });
    const remotionRoot = path.join(__dirname, 'remotion', 'index.js');
    
    bundledPath = await bundle({
      entryPoint: remotionRoot,
      webpackOverride: (config) => config,
    });
    
    logger.success('Bundle created', { requestId, path: bundledPath });

    // Step 2: Select composition
    logger.render('COMPOSITION', 'Loading video composition...', { requestId });
    const composition = await selectComposition({
      serveUrl: bundledPath,
      id: 'VideoShort',
      inputProps: { videoData },
    });
    
    logger.success('Composition loaded', {
      requestId,
      id: composition.id,
      dimensions: `${composition.width}x${composition.height}`,
      fps: composition.fps,
      frames: composition.durationInFrames
    });

    // Step 3: Render video
    logger.render('RENDER', 'Starting video render...', { requestId });
    const outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const videoId = videoData.videoId || `video_${Date.now()}`;
    outputPath = path.join(outputDir, `${videoId}.mp4`);

    let lastLoggedProgress = 0;
    await renderMedia({
      composition,
      serveUrl: bundledPath,
      codec: 'h264',
      outputLocation: outputPath,
      inputProps: { videoData },
      onProgress: ({ progress }) => {
        const percent = Math.round(progress * 100);
        if (percent >= lastLoggedProgress + 10) {
          logger.render('PROGRESS', `${percent}% complete`, { requestId });
          lastLoggedProgress = percent;
        }
      },
    });

    const renderTime = ((Date.now() - startTime) / 1000).toFixed(2);
    logger.success(`Video rendered in ${renderTime}s`, {
      requestId,
      videoId,
      outputPath,
      fileSize: fs.existsSync(outputPath) ? 
        `${(fs.statSync(outputPath).size / 1024 / 1024).toFixed(2)} MB` : 
        'unknown'
    });

    // Return success response
    res.json({
      status: 'success',
      message: 'Video rendered successfully!',
      requestId,
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
    logger.error('Render failed', error);
    logger.error('Additional context', {
      requestId,
      videoData: req.body.videoData ? {
        videoId: req.body.videoData.videoId,
        assetsCount: req.body.videoData.videoAssets?.length
      } : null
    });
    
    res.status(500).json({ 
      error: 'Video rendering failed',
      requestId,
      message: error.message,
      stack: process.env.NODE_ENV === 'production' ? undefined : error.stack,
      renderTime: `${((Date.now() - startTime) / 1000).toFixed(2)}s`
    });
  } finally {
    // Cleanup: Remove bundled files (but keep rendered video)
    if (bundledPath) {
      try {
        fs.rmSync(bundledPath, { recursive: true, force: true });
        logger.info('Cleaned up bundle files', { requestId });
      } catch (cleanupError) {
        logger.warn('Cleanup failed', cleanupError);
      }
    }
  }
});

// 404 handler
app.use((req, res) => {
  logger.warn(`404 Not Found: ${req.path}`);
  res.status(404).json({
    error: 'Not found',
    path: req.path,
    availableEndpoints: ['/', '/health', '/render (POST)']
  });
});

// Error handler
app.use((error, req, res, next) => {
  logger.error('Unhandled error', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message
  });
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log('═══════════════════════════════════════');
  console.log('🚀 Video Automation Server - Phase 4');
  console.log('═══════════════════════════════════════');
  console.log(`📡 Server:  http://localhost:${PORT}`);
  console.log(`✅ Health:  http://localhost:${PORT}/health`);
  console.log(`🎬 Render:  http://localhost:${PORT}/render`);
  console.log(`🔢 Node:    ${process.version}`);
  console.log(`🌍 Env:     ${process.env.NODE_ENV || 'development'}`);
  console.log('═══════════════════════════════════════');
  console.log('✨ Enhanced logging active!');
  console.log('═══════════════════════════════════════');
  
  logger.success('Server started successfully', {
    port: PORT,
    nodeVersion: process.version,
    env: process.env.NODE_ENV || 'development'
  });
});    });
    
    res.status(500).json({ 
      error: 'Video rendering failed',
      requestId,
      message: error.message,
      stack: process.env.NODE_ENV === 'production' ? undefined : error.stack,
      renderTime: `${((Date.now() - startTime) / 1000).toFixed(2)}s`
    });
  } finally {
    // Cleanup: Remove bundled files (but keep rendered video)
    if (bundledPath) {
      try {
        fs.rmSync(bundledPath, { recursive: true, force: true });
        logger.info('Cleaned up bundle files', { requestId });
      } catch (cleanupError) {
        logger.warn('Cleanup failed', cleanupError);
      }
    }
  }
});

// 404 handler
app.use((req, res) => {
  logger.warn(`404 Not Found: ${req.path}`);
  res.status(404).json({
    error: 'Not found',
    path: req.path,
    availableEndpoints: ['/', '/health', '/render (POST)']
  });
});

// Error handler
app.use((error, req, res, next) => {
  logger.error('Unhandled error', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message
  });
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log('═══════════════════════════════════════');
  console.log('🚀 Video Automation Server - Phase 4');
  console.log('═══════════════════════════════════════');
  console.log(`📡 Server:  http://localhost:${PORT}`);
  console.log(`✅ Health:  http://localhost:${PORT}/health`);
  console.log(`🎬 Render:  http://localhost:${PORT}/render`);
  console.log(`🔢 Node:    ${process.version}`);
  console.log(`🌍 Env:     ${process.env.NODE_ENV || 'development'}`);
  console.log('═══════════════════════════════════════');
  console.log('✨ Enhanced logging active!');
  console.log('═══════════════════════════════════════');
  
  logger.success('Server started successfully', {
    port: PORT,
    nodeVersion: process.version,
    env: process.env.NODE_ENV || 'development'
  });
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
