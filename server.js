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

    console.log('Starting render for:', videoData.videoId || 'unknown');
    
    const remotionRoot = path.join(__dirname, 'remotion', 'index.js');
    
    console.log('Step 1: Bundling...');
    bundledPath = await bundle({
      entryPoint: remotionRoot,
      webpackOverride: (config) => config,
    });
    
    console.log('Step 2: Loading composition...');
    const composition = await selectComposition({
      serveUrl: bundledPath,
      id: 'VideoShort',
      inputProps: { videoData },
    });
    
    console.log('Step 3: Rendering video...');
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
          console.log(`Progress: ${percent}%`);
        }
      },
    });

    const renderTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`Render complete in ${renderTime}s`);

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
    console.error('Render error:', error);
    
    res.status(500).json({ 
      error: 'Video rendering failed',
      message: error.message,
      stack: process.env.NODE_ENV === 'production' ? undefined : error.stack,
      renderTime: `${((Date.now() - startTime) / 1000).toFixed(2)}s`
    });
  } finally {
    if (bundledPath) {
      try {
        fs.rmSync(bundledPath, { recursive: true, force: true });
        console.log('Cleanup complete');
      } catch (cleanupError) {
        console.warn('Cleanup warning:', cleanupError.message);
      }
    }
  }
});

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
});    const outputDir = path.join(__dirname, 'output');
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
