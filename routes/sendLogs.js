import express from "express";
import axios from "axios";
import WebSocket from "ws";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

const NODE_FETCH_LOGS_URL = "http://localhost:4000/api/fetch-logs";
const FASTAPI_BASE_URL = "ws://127.0.0.1:8000/stream";

router.get("/send-logs", async (req, res) => {
  try {
    const { id } = req.query;
    if (!id) return res.status(400).json({ success: false, message: "Missing id parameter" });

    console.log(`Fetching logs for project ID: ${id}`);

    //Fetch logs from your /fetch-logs route
    const response = await axios.get(`${NODE_FETCH_LOGS_URL}?projectId=${id}`);
    const nestedData = response.data;

    //Flatten nested structure like success → data → data
    const logs = nestedData?.data?.data || nestedData?.data || [];

    if (!Array.isArray(logs)) {
      return res.status(500).json({ success: false, message: "Invalid logs format from /fetch-logs" });
    }

    console.log(`Received ${logs.length} logs`);

    if (logs.length === 0) {
      return res.json({
        success: true,
        message: "No logs to send",
        total_logs: 0,
        sent_logs: [],
        responses: []
      });
    }

    //Create FastAPI session
    const connectResp = await axios.post("http://127.0.0.1:8000/api/projects/connect", {
      api_key: process.env.OPENAI_API_KEY,
      project_id: id
    });

    console.log("FastAPI session response:", connectResp.data);
    const session_id = connectResp.data?.session_id || connectResp.data?.sessionId;
    if (!session_id)
      return res.status(500).json({ success: false, message: "Failed to create FastAPI session" });

    //Connect WebSocket
    const ws = new WebSocket(`${FASTAPI_BASE_URL}/${session_id}`);

    // Store logs and responses
    const sentLogs = [];
    const aiResponses = [];

    ws.on("open", async () => {
      console.log("Connected to FastAPI WebSocket");

      //Send logs sequentially
      for (const log of logs) {
        // Ensure minimal clean payload (AI model expects consistent schema)
        const cleanLog = {
          id: log.id || null,
          level: (log.level || "INFO").toUpperCase(),
          message: log.message || "",
          source: log.source || "unknown",
          metadata: log.metadata || {},
          timestamp: log.timestamp || new Date().toISOString()
        };

        const payload = {
          type: "log",
          data: cleanLog
        };

        sentLogs.push(cleanLog);

        console.log(`Sending payload for log ID: ${log.id || "N/A"}`);
        ws.send(JSON.stringify(payload));

        try {
          // Wait for AI response with timeout
          const aiData = await new Promise((resolve, reject) => {
            const timer = setTimeout(() => reject(new Error("Timeout waiting for AI response")), 7000);
            ws.once("message", (message) => {
              clearTimeout(timer);
              try {
                const data = JSON.parse(message.toString());
                resolve(data);
              } catch (err) {
                reject(new Error("Failed to parse AI response JSON"));
              }
            });
          });

          console.log(`AI/ML response for log ID ${log.id || "N/A"}:`, JSON.stringify(aiData, null, 2));
          aiResponses.push({ log_id: log.id, ai_response: aiData });

        } catch (err) {
          console.error(`Error for log ID ${log.id || "N/A"}:`, err.message);
          aiResponses.push({ log_id: log.id, ai_response: null, error: err.message });
        }

        // Slight delay between sends (to prevent WS overload)
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log("All logs sent and AI/ML responses received");

      if (!res.headersSent) {
        res.json({
          success: true,
          message: "All logs sent and AI/ML responses received",
          total_logs: logs.length,
          sent_logs: sentLogs,
          responses: aiResponses
        });
      }

      ws.close();
    });

    ws.on("error", (err) => {
      console.error("WebSocket error:", err.message);
      if (!res.headersSent)
        res.status(500).json({ success: false, message: "WebSocket error", error: err.message });
    });

    ws.on("close", () => console.log("WebSocket connection closed"));

  } catch (error) {
    console.error("Error in /send-logs:", error.message);
    if (!res.headersSent)
      res.status(500).json({
        success: false,
        message: "Failed to send logs or receive AI response",
        error: error.message
      });
  }
});

export default router;
