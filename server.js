import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { existsSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const distPath = path.join(__dirname, "dist");

// Serve static files with proper MIME types and caching
app.use(express.static(distPath, {
  maxAge: "1y",
  etag: true,
  lastModified: true,
  setHeaders: (res, filePath) => {
    // Set proper MIME types for JavaScript and CSS files
    if (filePath.endsWith(".js")) {
      res.setHeader("Content-Type", "application/javascript; charset=utf-8");
    } else if (filePath.endsWith(".css")) {
      res.setHeader("Content-Type", "text/css; charset=utf-8");
    }
  }
}));

// SPA fallback: serve index.html only for non-file requests
app.get("*", (req, res) => {
  // Skip API routes
  if (req.path.startsWith("/api")) {
    return res.status(404).json({ error: "API endpoint not found" });
  }
  
  // Check if the request is for a static asset (has file extension)
  const hasFileExtension = /\.[^/]+$/.test(req.path);
  
  if (hasFileExtension) {
    // This is a file request - if it wasn't served by static middleware, return 404
    const filePath = path.join(distPath, req.path);
    if (existsSync(filePath)) {
      // File exists but wasn't served - this shouldn't happen, but serve it anyway
      return res.sendFile(filePath);
    }
    // File doesn't exist - return 404 with proper error
    return res.status(404).send("File not found");
  }
  
  // This is a route request (no file extension) - serve index.html for SPA routing
  const indexPath = path.join(distPath, "index.html");
  if (existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(500).send("index.html not found");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Frontend running on port ${PORT}`));
