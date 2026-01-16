import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Only import Remotion packages when actually rendering
// This prevents errors if packages aren't fully installed yet
let bundle, renderMedia, selectComposition;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Health check (doesn't need Remotion)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'remotion-renderer',
    timestamp: new Date().toISOString()
  });
});

// Render endpoint
app.post('/render', async (req, res) => {
  try {
    // Lazy load Remotion packages only when needed
    if (!bundle) {
      const bundlerModule = await import('@remotion/bundler');
      const rendererModule = await import('@remotion/renderer');
      bundle = bundlerModule.bundle;
      renderMedia = rendererModule.renderMedia;
      selectComposition = rendererModule.selectComposition;
    }

    const { videoData } = req.body;
    
    if (!videoData) {
      return res.status(400).json({ error: 'videoData is required' });
    }
    
    console.log('Rendering video:', videoData.videoId);
    
    // Bundle the Remotion project
    const bundleLocation = await bundle({
      entryPoint: path.join(__dirname, 'src/index.js'),
      webpackOverride: (config) => config,
    });
    
    // Get composition
    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: 'VideoShort',
      inputProps: { videoData },
    });
    
    // Create output directory
    const outDir = path.join(__dirname, 'out');
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
    
    // Output path
    const outputPath = path.join(outDir, `${videoData.videoId}.mp4`);
    
    // Render video
    await renderMedia({
      composition,
      serveUrl: bundleLocation,
      codec: 'h264',
      outputLocation: outputPath,
      inputProps: { videoData },
      onProgress: ({ progress }) => {
        console.log(`Rendering: ${Math.round(progress * 100)}%`);
      },
    });
    
    console.log('Render complete:', outputPath);
    
    // Send file back
    res.sendFile(outputPath);
    
  } catch (error) {
    console.error('Render error:', error);
    res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'production' ? undefined : error.stack 
    });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Remotion render server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
});
```

### 4. Create `.nvmrc` File (Specifies Node Version)

Create a new file called `.nvmrc` in your project root:
```
18.17.0
