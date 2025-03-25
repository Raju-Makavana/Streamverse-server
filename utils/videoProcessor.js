import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';

const RESOLUTIONS = {
  '240p': { height: 240, bitrate: '500k' },
  '480p': { height: 480, bitrate: '1500k' },
  '720p': { height: 720, bitrate: '3000k' },
  '1080p': { height: 1080, bitrate: '5000k' }
};

// async function createHLSStream(inputPath, outputDir, filename) {
//   try {
//     console.log("createHLSStream")
//     await fs.promises.mkdir(outputDir, { recursive: true });
//     const resolutionOutputs = {};
//     const completedResolutions = new Set();
    
//     return new Promise((resolve, reject) => {
//       const masterPlaylist = [];
      
//       Object.entries(RESOLUTIONS).forEach(([quality, settings]) => {
//         const qualityDir = path.join(outputDir, quality);
//         fs.mkdirSync(qualityDir, { recursive: true });
//         console.log("qualityDir",qualityDir)
//         console.log("quality",quality,"filename",filename)
//         const playlistPath = path.join(quality, `${filename}.m3u8`);
//         resolutionOutputs[quality] = `/uploads/videos/${path.join(path.basename(outputDir), playlistPath)}`.replace(/\\/g, '/');
//         console.log("playlistPath", playlistPath)
//         console.log("createHLSStream 2")

//         ffmpeg(inputPath)
//           .addOptions([
//             '-profile:v main',
//             '-c:v h264',
//             '-c:a aac',
//             '-ar 48000',
//             '-b:a 128k',
//             '-color_range 1',
//             '-colorspace 1',
//             '-color_trc 1',
//             '-color_primaries 1',
//             '-f hls',
//             '-hls_time 10',
//             '-hls_list_size 0',
//             '-hls_segment_filename', path.join(qualityDir, `${filename}_%03d.ts`),
//             `-vf scale=-2:${settings.height}`,
//             `-b:v ${settings.bitrate}`,
//           ])
//           .output(path.join(qualityDir, `${filename}.m3u8`))
//           .on('end', () => {
//             masterPlaylist.push(`#EXT-X-STREAM-INF:BANDWIDTH=${parseInt(settings.bitrate)}000,RESOLUTION=${settings.height}p\n${playlistPath}`);
//             completedResolutions.add(quality);
            
//             if (completedResolutions.size === Object.keys(RESOLUTIONS).length) {
//               const masterContent = '#EXTM3U\n' + masterPlaylist.join('\n');
//               fs.writeFileSync(path.join(outputDir, 'master.m3u8'), masterContent);
//               resolve(resolutionOutputs);
//             }
//           })
//           .on('error', (err) => {
//             reject(new Error(`FFmpeg error for ${quality}: ${err.message}`));
//           })
//           .run();
//       });
//     });
//   } catch (error) {
//     throw new Error(`Setup error: ${error.message}`);
//   }
// }

async function createHLSStream(inputPath, outputDir, filename) {
  try {
    await fs.promises.mkdir(outputDir, { recursive: true });
    const resolutionOutputs = {};
    const completedResolutions = new Set();
    
    return new Promise((resolve, reject) => {
      const masterPlaylist = [];
      
      Object.entries(RESOLUTIONS).forEach(([quality, settings]) => {
        const qualityDir = path.join(outputDir, quality);
        fs.mkdirSync(qualityDir, { recursive: true });
        
        const playlistPath = path.join(quality, `${filename}.m3u8`);
        resolutionOutputs[quality] = `/uploads/videos/${path.join(path.basename(outputDir), playlistPath)}`.replace(/\\/g, '/');

        ffmpeg(inputPath)
          .addOptions([
            '-profile:v main',
            '-c:v h264',
            '-c:a aac',
            '-ar 48000',
            '-b:a 128k',
            '-color_range 1',
            '-colorspace 1',
            '-color_trc 1',
            '-color_primaries 1',
            '-f hls',
            '-hls_time 10',
            '-hls_list_size 0',
            '-hls_segment_filename', path.join(qualityDir, `${filename}_%03d.ts`),
            `-vf scale=-2:${settings.height}`,
            `-b:v ${settings.bitrate}`,
          ])
          .output(path.join(qualityDir, `${filename}.m3u8`))
          .on('end', () => {
            masterPlaylist.push(`#EXT-X-STREAM-INF:BANDWIDTH=${parseInt(settings.bitrate)}000,RESOLUTION=${settings.height}p\n${playlistPath}`);
            completedResolutions.add(quality);
            
            if (completedResolutions.size === Object.keys(RESOLUTIONS).length) {
              const masterContent = '#EXTM3U\n' + masterPlaylist.join('\n');
              fs.writeFileSync(path.join(outputDir, 'master.m3u8'), masterContent);
              resolve(resolutionOutputs);
            }
          })
          .on('error', (err) => {
            reject(new Error(`FFmpeg error for ${quality}: ${err.message}`));
          })
          .run();
      });
    });
  } catch (error) {
    throw new Error(`Setup error: ${error.message}`);
  }
}

export async function createVideoResolutions( inputPath, outputDir, filename) {
  try {
    if (!fs.existsSync(inputPath)) {
      throw new Error('Input video file not found');
    }
    
    const hlsOutputDir = path.join(outputDir, 'hls');
    const hlsUrls = await createHLSStream(inputPath, hlsOutputDir, filename);
    
    return {
      ...hlsUrls,
      masterPlaylist: `/uploads/videos/${path.basename(outputDir)}/hls/master.m3u8`.replace(/\\/g, '/')
    };
  } catch (error) {
    throw new Error(`Error processing video: ${error.message}`);
  }
}