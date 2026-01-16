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
      nextSteps: 'Add Remotion dependencies and rendering logic'
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
});
```

4. Commit: "Simplify server.js - Phase 1 working server"

---

### Step 5: Trigger Render.com Deployment

Now go to Render.com:

1. Open your dashboard: `dashboard.render.com`
2. Click on `video-automation` service
3. Click **"Manual Deploy"** dropdown
4. Select **"Clear build cache & deploy"**
5. Wait 5-10 minutes

Watch the logs. You should see:
```
✅ Build successful
✅ Deploy successful
═══════════════════════════════════════
🚀 Video Automation Server - Phase 1
═══════════════════════════════════════
📡 Server:  http://localhost:10000
✅ Health:  http://localhost:10000/health
...18.17.0
