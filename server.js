import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'Server is running!',
    service: 'video-automation',
    version: '1.0.0',
    phase: 'Phase 1 - Basic Server',
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
    env: process.env.NODE_ENV || 'development'
  });
});

// Placeholder render endpoint (Phase 1)
app.post('/render', async (req, res) => {
  try {
    const { videoData } = req.body;
    
    if (!videoData) {
      return res.status(400).json({ 
        error: 'videoData is required',
        received: req.body 
      });
    }
    
    console.log('Render request received for:', videoData.videoId || 'unknown');
    
    // Phase 1: Just confirm server works
    // Phase 2: We'll add Remotion rendering here
    res.json({
      status: 'success',
      phase: 'Phase 1 - Server is working!',
      message: 'Remotion rendering will be added in Phase 2',
      videoId: videoData.videoId || 'test',
      timestamp: new Date().toISOString(),
      receivedData: {
        hasVideoAssets: !!videoData.videoAssets,
        hasAudio: !!videoData.audioBase64,
        channelName: videoData.channelName || 'unknown'
      }
    });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'production' ? undefined : error.stack
    });
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
  console.log('🚀 Video Automation Server - Phase 1');
  console.log('═══════════════════════════════════════');
  console.log(`📡 Server:  http://localhost:${PORT}`);
  console.log(`✅ Health:  http://localhost:${PORT}/health`);
  console.log(`🎬 Render:  http://localhost:${PORT}/render`);
  console.log(`🔢 Node:    ${process.version}`);
  console.log(`🌍 Env:     ${process.env.NODE_ENV || 'development'}`);
  console.log('═══════════════════════════════════════');
  console.log('Phase 1: Basic server running');
  console.log('Next: Add Remotion in Phase 2');
  console.log('═══════════════════════════════════════');
});
