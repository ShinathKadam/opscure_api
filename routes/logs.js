import express from "express";
import axios from "axios";
import { wrapper } from "axios-cookiejar-support";
import { CookieJar } from "tough-cookie";
import fs from "fs";
import { DB_FILE } from "../config/index.js";
import { tryLogin, tryRegister } from "../helpers/replitAuth.js";

const router = express.Router();

router.get("/fetch-logs", async (req, res) => {
  try {
    const { projectUrl } = req.query;
    if (!projectUrl)
      return res.status(400).json({ success: false, message: "Missing projectUrl" });

    // const db = JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
    // const project = db.projects?.find((p) => p.id === projectUrl);
    // if (!project)
    //   return res.status(404).json({ success: false, message: "Project not found" });

    const REPLIT_URL = projectUrl;
    const jar = new CookieJar();
    const client = wrapper(axios.create({ jar, withCredentials: true }));

    //STEP 1: Try fetching logs directly (no authentication)
    try {      
      const directLogs = await client.get(`${REPLIT_URL}/api/logs`);
      return res.json({
        success: true,
        source: "Replit API (no auth)",
        data: directLogs.data,
      });
    } catch (err) {
      // Only proceed to login/register if 401 or 403
      if (![401, 403].includes(err.response?.status)) {
        console.error("Error fetching logs:", err.message);
        return res.status(500).json({
          success: false,
          message: "Failed to fetch logs",
          error: err.message,
        });
      }
    }

    // STEP 2: Try login
    let loginResp;
    try {
      loginResp = await tryLogin(client, REPLIT_URL);
    } catch (err) {
      // STEP 3: If login fails, try register → login again
      if (err.response?.status === 401 || err.response?.status === 404) {
        await tryRegister(client, REPLIT_URL);
        loginResp = await tryLogin(client, REPLIT_URL);
      } else {
        throw err;
      }
    }

    if (!loginResp || loginResp.status !== 200)
      return res
        .status(401)
        .json({ success: false, message: "Login failed" });

    // STEP 4: Fetch logs after successful login
    const logsResp = await client.get(`${REPLIT_URL}/api/logs`);
      console.log(`URL: ${REPLIT_URL}/api/logs`);

    res.json({
      success: true,
      source: "Replit API (with auth)",
      data: logsResp.data,
    });
  } catch (error) {
    console.error("Error fetching logs:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch logs",
      error: error.message,
    });
  }
});

export default router;
