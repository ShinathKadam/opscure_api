import express from "express";
import cors from "cors";
import fs from "fs";
import { PORT, DB_FILE } from "./config/index.js";
import logsRoutes from "./routes/logs.js";
import projectRoutes from "./routes/projects.js";
import sendLogsRoutes from "./routes/sendLogs.js";
// import logsRouter from "./routes/test.js";

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

// Ensure db.json exists
if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify({ projects: [] }, null, 2));

// Routes
app.use("/api", logsRoutes);
app.use("/api", projectRoutes);
app.use("/api", sendLogsRoutes);
// app.use("/api", logsRouter);

app.listen(PORT, () => {
  console.log(`✅ Local API running at http://localhost:${PORT}`);
});
