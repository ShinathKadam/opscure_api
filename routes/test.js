import express from "express";
import { v4 as uuidv4 } from "uuid";
import WebSocket from "ws";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();
const router = express.Router();

// Generate dummy logs
function generateDummyLog() {
  const severities = ["debug", "info", "warning", "error", "critical"];
  const services = ["auth-service", "payment-service", "user-service", "notification-service"];
  
  return {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    service: services[Math.floor(Math.random() * services.length)],
    severity: severities[Math.floor(Math.random() * severities.length)],
    message: "This is a dummy log message for testing purposes.",
    metadata: {
      user_id: Math.floor(Math.random() * 1000),
      ip: `192.168.0.${Math.floor(Math.random() * 255)}`
    }
  };
}

// Transform AI responses into processing result
function transformAIResponses(rawResponses) {
  const processed_logs = rawResponses.map(r => ({
    ...r,
    detected_patterns: r.detected_patterns || [],
    extracted_metrics: r.extracted_metrics || {},
    business_impact: r.business_impact || 0,
    revenue_impact_usd: r.revenue_impact_usd || 0,
    confidence_score: r.confidence_score || 0
  }));

  const clusters = rawResponses.map(r => ({
    pattern_name: r.pattern_name || "unknown",
    root_cause: r.root_cause || "unknown",
    recommended_actions: r.recommended_actions || [],
    confidence: r.confidence || 0,
    business_impact: r.business_impact || 0
  }));

  const correlations = rawResponses.map(r => ({
    services_involved: r.services_involved || [],
    time_sequence: r.time_sequence || [],
    correlation_strength: r.correlation_strength || 0,
    description: r.description || ""
  }));

  const business_metrics = {
    total_business_impact: processed_logs.reduce((sum, l) => sum + (l.business_impact || 0), 0),
    critical_issues: processed_logs.filter(l => l.severity === "critical").length,
    escalations_triggered: 0,
    anomaly_rate: 0,
    overall_risk: "medium"
  };

  const processing_stats = {
    health_status: "healthy",
    performance_score: 95,
    insights: [],
    alerts: [],
    recommendations: []
  };

  const component_stats = {
    api_calls_per_component: {},
    tokens_used: 0,
    processing_time: 0,
    success_rates: {}
  };

  return {
    processed_logs,
    clusters,
    correlations,
    business_metrics,
    processing_stats,
    component_stats
  };
}

// Route: send logs and receive AI analysis
router.post("/send-logs2", async (req, res) => {
  const logCount = req.body.count || 5;
  const projectId = "123456";
  const apiKey = process.env.OPENAI_API_KEY || "12345678901234567890";

  try {
    //Create session
    const sessionResp = await fetch("http://127.0.0.1:8000/api/projects/connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project_id: projectId, api_key: apiKey })
    });
    const sessionData = await sessionResp.json();
    const sessionId = sessionData.session_id;
    if (!sessionId) throw new Error("Failed to create session");

    const logs = [];
    const rawAIResponses = [];

    //Open WebSocket
    const ws = new WebSocket(`ws://127.0.0.1:8000/stream/${sessionId}`);

    ws.on("open", async () => {
      // Send all logs
      for (let i = 0; i < logCount; i++) {
        const log = generateDummyLog();
        logs.push(log);
        ws.send(JSON.stringify(log));
        await new Promise(r => setTimeout(r, 100)); // slight delay between logs
      }
    });

    // Listen for AI responses
    ws.on("message", (msg) => {
      try {
        const data = JSON.parse(msg);
        // Only push valid responses
        if (data.id) rawAIResponses.push(data);
      } catch (e) {
        console.error("Invalid AI response:", msg.toString());
      }
    });

    ws.on("error", (err) => {
      console.error("WebSocket error:", err.message);
      if (!res.headersSent) res.status(500).json({ status: "error", message: err.message });
    });

    ws.on("close", () => {
      if (!res.headersSent) {
        const processingResult = transformAIResponses(rawAIResponses);
        res.json({
          status: "success",
          session_id: sessionId,
          sent_logs: logs,
          processing_result: processingResult
        });
      }
    });

    // Close WebSocket automatically after all responses likely received
    setTimeout(() => {
      if (ws.readyState === WebSocket.OPEN) ws.close();
    }, logCount * 500); // 0.5s per log for AI to respond

  } catch (error) {
    console.error(error);
    if (!res.headersSent) res.status(500).json({ status: "error", message: error.message });
  }
});

export default router;
