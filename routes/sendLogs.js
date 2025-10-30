import express from "express";
import axios from "axios";

const router = express.Router();

/**
 * Convert structured logs → formatted text
 */
function convertLogsToStrings(logArray = []) {
  return logArray.map((log) => {
    const date = new Date(log.timestamp || Date.now());
    const formattedDate = date.toISOString().replace("T", " ").split(".")[0];
    const level = log.level?.toUpperCase() || "INFO";
    const message = log.message || "";
    const source = log.source || "system";
    return `${formattedDate} ${level} [${source}] ${message}`;
  });
}


/**
 * POST /api/send-logs → Send logs to FastAPI (AI/ML backend)
 */
router.post("/send-logs", async (req, res) => {
  try {
    const { logs, projectUrl } = req.body;

    if (!logs || logs.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "No logs received from frontend",
      });
    }

    let formattedLogs = [];

    if (Array.isArray(logs) && typeof logs[0] === "object") {
      formattedLogs = convertLogsToStrings(logs);
    } else if (Array.isArray(logs)) {
      formattedLogs = logs;
    } else if (typeof logs === "string") {
      formattedLogs = logs.split("\n").filter((line) => line.trim());
    }

    console.log("✅ Sending logs to FastAPI:", formattedLogs.length);

    const aiResponse = await axios.post("http://127.0.0.1:8000/send-logs", {
      logs: formattedLogs.join("\n"),
      projectUrl,
    });

    return res.json({
      status: "success",
      total_logs: formattedLogs.length,
      ai_response: aiResponse.data,
    });
  } catch (error) {
    console.error("❌ Error in /send-logs:", error.message);

    // Return consistent structured JSON so frontend never breaks
    return res.status(500).json({
      status: "error",
      message: "Failed to analyze logs",
      details: error.message,
    });
  }
});

export default router;
