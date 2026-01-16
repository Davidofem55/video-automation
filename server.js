import express from 'express';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'remotion-renderer' });
});

// Render endpoint
app.post('/render', async (req, res) => {
  try {
    const { videoData } = req.body;
    
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
      stack: error.stack 
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Remotion render server running on port ${PORT}`);
});
