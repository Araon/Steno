import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import type { Captions, AspectRatio } from "@steno/contracts";
import { renderVideo } from "./render.js";
import type { RenderJob, RenderRequest, RenderResponse, RenderProgressResponse } from "./types.js";

// Configuration
const PORT = process.env.PORT || 3001;
const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://localhost:8000";
const STORAGE_DIR = process.env.STORAGE_DIR || path.resolve(process.cwd(), "../api/storage");
const VIDEO_STORAGE_DIR = path.join(STORAGE_DIR, "videos");
const RENDER_OUTPUT_DIR = path.join(STORAGE_DIR, "renders");

// Ensure directories exist
fs.mkdirSync(VIDEO_STORAGE_DIR, { recursive: true });
fs.mkdirSync(RENDER_OUTPUT_DIR, { recursive: true });

// In-memory job store (in production, use Redis or a database)
const jobs = new Map<string, RenderJob>();

// Express app
const app = express();

// Middleware
app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
  ],
  credentials: true,
}));
app.use(express.json({ limit: "50mb" }));

// Serve rendered videos
app.use("/renders", express.static(RENDER_OUTPUT_DIR));

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", version: "0.1.0", service: "renderer-api" });
});

/**
 * Find video file by ID (supports different extensions)
 */
function findVideoPath(videoId: string): string | null {
  const extensions = [".mp4", ".mov", ".avi", ".mkv", ".webm", ".m4v"];
  for (const ext of extensions) {
    const videoPath = path.join(VIDEO_STORAGE_DIR, `${videoId}${ext}`);
    if (fs.existsSync(videoPath)) {
      return videoPath;
    }
  }
  return null;
}

/**
 * Start render job
 * POST /api/render
 */
app.post("/api/render", async (req, res) => {
  try {
    const { videoId, captions, aspectRatio = "9:16", quality = 80 } = req.body as RenderRequest;

    // Validate required fields
    if (!videoId) {
      return res.status(400).json({ error: "videoId is required" });
    }
    if (!captions || !captions.captions) {
      return res.status(400).json({ error: "captions is required" });
    }

    // Find video file
    const videoPath = findVideoPath(videoId);
    if (!videoPath) {
      return res.status(404).json({ error: `Video not found: ${videoId}` });
    }

    // Create job
    const jobId = uuidv4();
    const job: RenderJob = {
      id: jobId,
      status: "pending",
      progress: 0,
      videoId,
      captions: captions as Captions,
      aspectRatio: aspectRatio as AspectRatio,
      quality,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    jobs.set(jobId, job);

    // Start rendering in background
    const outputPath = path.join(RENDER_OUTPUT_DIR, `${jobId}.mp4`);

    // Don't await - let it run in background
    processRenderJob(job, videoPath, outputPath).catch((error) => {
      console.error(`Render job ${jobId} failed:`, error);
      job.status = "error";
      job.error = error instanceof Error ? error.message : "Render failed";
      job.updatedAt = new Date();
    });

    const response: RenderResponse = {
      jobId,
      status: job.status,
    };

    return res.json(response);
  } catch (error) {
    console.error("Error starting render:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
});

/**
 * Get render job status
 * GET /api/render/:jobId
 */
app.get("/api/render/:jobId", (req, res) => {
  const { jobId } = req.params;

  const job = jobs.get(jobId);
  if (!job) {
    return res.status(404).json({ error: "Job not found" });
  }

  const response: RenderProgressResponse = {
    jobId: job.id,
    status: job.status,
    progress: job.progress,
    error: job.error,
    outputUrl: job.status === "complete" ? `/renders/${jobId}.mp4` : undefined,
  };

  return res.json(response);
});

/**
 * Cancel render job
 * DELETE /api/render/:jobId
 */
app.delete("/api/render/:jobId", (req, res) => {
  const { jobId } = req.params;

  const job = jobs.get(jobId);
  if (!job) {
    return res.status(404).json({ error: "Job not found" });
  }

  // Mark as cancelled (actual cancellation of rendering is complex)
  if (job.status === "pending" || job.status === "rendering") {
    job.status = "error";
    job.error = "Cancelled by user";
    job.updatedAt = new Date();
  }

  return res.json({ status: "cancelled", jobId });
});

/**
 * Process a render job
 */
async function processRenderJob(
  job: RenderJob,
  videoPath: string,
  outputPath: string
): Promise<void> {
  job.status = "rendering";
  job.updatedAt = new Date();

  try {
    await renderVideo({
      job,
      videoPath,
      outputPath,
      onProgress: (progress) => {
        job.progress = progress;
        job.updatedAt = new Date();
      },
    });

    job.status = "complete";
    job.progress = 100;
    job.outputPath = outputPath;
    job.updatedAt = new Date();

    console.log(`Render job ${job.id} completed: ${outputPath}`);
  } catch (error) {
    job.status = "error";
    job.error = error instanceof Error ? error.message : "Render failed";
    job.updatedAt = new Date();
    throw error;
  }
}

/**
 * Cleanup old jobs and files (run periodically in production)
 */
function cleanupOldJobs(): void {
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours
  const now = Date.now();

  for (const [jobId, job] of jobs.entries()) {
    const age = now - job.createdAt.getTime();
    if (age > maxAge) {
      // Delete output file if exists
      if (job.outputPath && fs.existsSync(job.outputPath)) {
        fs.unlinkSync(job.outputPath);
      }
      jobs.delete(jobId);
      console.log(`Cleaned up old job: ${jobId}`);
    }
  }
}

// Run cleanup every hour
setInterval(cleanupOldJobs, 60 * 60 * 1000);

// Start server
app.listen(PORT, () => {
  console.log(`Renderer API running at http://localhost:${PORT}`);
  console.log(`Video storage: ${VIDEO_STORAGE_DIR}`);
  console.log(`Render output: ${RENDER_OUTPUT_DIR}`);
});
