import express from "express";
import multer from "multer";
import path from "path";
import fs, { rmSync } from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure multer storage
// const storage = multer.diskStorage({

//   destination: (req, file, cb) => {
//     let uploadPath;
//     switch (file.fieldname) {
//       case 'video':
//         uploadPath = path.join(__dirname, '../public/uploads/videos', req.params.mediaId || 'temp');
//         break;
//       case 'poster':
//         uploadPath = path.join(__dirname, '../public/uploads/posters', req.params.mediaId || 'temp');
//         break;
//       case 'image':
//         uploadPath = path.join(__dirname, '../public/uploads/slider', req.params.sliderId || 'temp');
//         break;
//       default:
//         uploadPath = path.join(__dirname, '../public/uploads');
//     }

//     fs.mkdirSync(uploadPath, { recursive: true, mode: 0o755 });
//     cb(null, uploadPath);
//   },
//   filename: (req, file, cb) => {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//     cb(null, uniqueSuffix + path.extname(file.originalname));
//   }
// });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      const baseDir = process.cwd();
      let uploadPath;

      switch (file.fieldname) {
        case "video":
          uploadPath = path.join(
            baseDir,
            "public",
            "uploads",
            "videos",
            req.params.mediaId || "temp"
          );
          break;
        case "poster":
          uploadPath = path.join(
            baseDir,
            "public",
            "uploads",
            "posters",
            req.params.mediaId || "temp"
          );
          break;
        case "image":
          uploadPath = path.join(
            baseDir,
            "public",
            "uploads",
            "slider",
            req.params.sliderId || "temp"
          );
          break;
        default:
          uploadPath = path.join(baseDir, "public", "uploads");
      }

      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true, mode: 0o755 });
      }

      cb(null, uploadPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// Configure multer upload
export const upload = multer({
  storage,
  limits: {
    fileSize: (req, file) => {
      return file.fieldname === "video" ? 2000 * 1024 * 1024 : 5 * 1024 * 1024;
    },
  },
  fileFilter: (req, file, cb) => {
    switch (file.fieldname) {
      case "video":
        if (!file.mimetype.startsWith("video/")) {
          return cb(new Error("Only video files are allowed!"));
        }
        break;
      case "poster":
      case "image":
        if (!file.mimetype.startsWith("image/")) {
          return cb(new Error("Only image files are allowed!"));
        }
        break;
    }
    cb(null, true);
  },
});

// Utility function to move files from temp to permanent location
export const moveFile = async (oldPath, newPath) => {
  try {
    await fs.promises.mkdir(path.dirname(newPath), { recursive: true });
    await fs.promises.rename(oldPath, newPath);
    return true;
  } catch (error) {
    console.error("Error moving file:", error);
    return false;
  }
};

// Setup media routes
export const setupMediaRoutes = (app) => {
  console.log("Setting up media routes...");

  // Serve static files from public directory
  // app.use("/public", express.static(path.join(__dirname, "../public")));
  // Serve HLS files with correct MIME types
  app.use(
    "/api/v1/public/uploads",
    express.static(path.join(__dirname, "../public/uploads"), {
      setHeaders: (res, path) => {
        if (path.endsWith(".m3u8")) {
          res.setHeader("Content-Type", "application/x-mpegURL");
        }
        if (path.endsWith(".ts")) {
          res.setHeader("Content-Type", "video/MP2T");
        }
      },
    })
  );

  // Helper function to handle media requests
  const handleMediaRequest = async (req, res) => {
    try {
      // Extract the media type and path from the URL
      const urlPath = req.url.split("/api/v1/public/uploads/")[1];
      if (!urlPath) {
        return res.status(400).send("Invalid URL format");
      }

      // Split the path into media type and file path
      const [mediaType, ...pathParts] = urlPath.split("/");
      const filePath = pathParts.join("/");

      // Map the URL media type to the actual directory
      let mediaDirectory;
      switch (mediaType) {
        case "videos":
          mediaDirectory = "videos";
          break;
        case "posters":
          mediaDirectory = "posters";
          break;
        case "slider":
          mediaDirectory = "slider";
          break;
        default:
          return res.status(400).send("Invalid media type");
      }

      // Construct the full file path
      const fullPath = path.join(
        __dirname,
        "../public/uploads",
        mediaDirectory,
        filePath
      );

      // Check if file exists
      try {
        await fs.promises.access(fullPath, fs.constants.F_OK);
        res.sendFile(fullPath);
      } catch (err) {
        res.status(404).send("File not found");
      }
    } catch (error) {
      res.status(500).send("Internal server error");
    }
  };

  // Set up a single route handler for all media types
  app.get(
    "/api/v1/public/uploads/:mediaType/:mediaId/hls/*",
    handleMediaRequest
  );

  // Set CORS headers for all routes
  app.use((req, res, next) => {
    res.setHeader("Content-Type", "application/x-mpegURL");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, HEAD");
    next();
  });
};
