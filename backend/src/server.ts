// backend/src/server.ts
import dotenv from "dotenv";
dotenv.config(); // Load env vars immediately

import app from "./app";

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Personal Site Backend is running on http://localhost:${PORT}`);
});
