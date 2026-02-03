// backend/src/server.ts
import dotenv from "dotenv";
dotenv.config(); // Load env vars immediately

import app from "./app";

// Vercel runs Node code as Serverless Functions (no long-running servers).
// Locally (and on other platforms), we still start an HTTP server.
if (!process.env.VERCEL) {
  const PORT = Number(process.env.PORT || 5000);
  app.listen(PORT, () => {
    console.log(`Personal Site Backend is running on http://localhost:${PORT}`);
  });
}

// Export the Express app for Vercel (@vercel/node) to invoke per-request.
export = app;
