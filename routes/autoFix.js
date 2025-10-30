import express from "express";
import axios from "axios";

const router = express.Router();

/**
 * POST /send-auto-fix
 * Expected body:
 * {
 *   "baseUrl": "https://team-task-forge-supreethreddy98.replit.app",
 *   "endpoint": "/api/auto-fix",
 *   "data": { ... any payload ... }
 * }
 */
router.post("/send-auto-fix", async (req, res) => {
  try {
    const { baseUrl, endpoint, data } = req.body;

    if (!baseUrl || !endpoint || !data) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: baseUrl, endpoint, or data",
      });
    }

    // Clean and construct URL
    const apiUrl = `${baseUrl.trim()}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

    console.log("🚀 Sending request to:", apiUrl);

    const response = await axios.post(apiUrl, data, {
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 30000,
    });

    console.log("✅ Response received from remote API");

    res.json({
      success: true,
      message: `Data successfully sent to ${apiUrl}`,
      remoteResponse: response.data,
    });
  } catch (error) {
    console.error("❌ Error sending request:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to send request",
      error: error.message,
    });
  }
});

export default router;
