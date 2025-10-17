import express from "express";
import fs from "fs";
import { DB_FILE } from "../config/index.js";

const router = express.Router();

// Add new project
router.post("/add-project", (req, res) => {
  try {
    const project = req.body;

    if (!project || !project.name || !project.platform) {
      return res.status(400).json({ success: false, message: "Project name and platform are required" });
    }

    const db = JSON.parse(fs.readFileSync(DB_FILE, "utf8"));

    const newProject = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString().split("T")[0],
      status: "healthy",
      lastUpdated: "just now",
      issues: 0,
      ...project
    };

    db.projects.push(newProject);
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));

    res.status(201).json({ success: true, message: "Project added", project: newProject });
  } catch (err) {
    console.error("Error saving project:", err);
    res.status(500).json({ success: false, message: "Failed to add project", error: err.message });
  }
});

// Get all projects
router.get("/get-projects", (req, res) => {
  try {
    if (!fs.existsSync(DB_FILE)) {
      return res.status(404).json({ success: false, message: "Database not found" });
    }

    const db = JSON.parse(fs.readFileSync(DB_FILE, "utf8"));

    res.json({ success: true, projects: db.projects || [] });
  } catch (err) {
    console.error("Error reading projects:", err);
    res.status(500).json({ success: false, message: "Failed to fetch projects", error: err.message });
  }
});

// Get project URL by name
router.get("/get-project-url", (req, res) => {
  try {
    const projectName = req.query.name;

    if (!projectName) {
      return res.status(400).json({ success: false, message: "Project name is required" });
    }

    if (!fs.existsSync(DB_FILE)) {
      return res.status(404).json({ success: false, message: "Database not found" });
    }

    const db = JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
    const projects = db.projects || db.logs || [];

    const project = projects.find(
      (p) => p.name.toLowerCase() === projectName.toLowerCase()
    );

    if (!project) {
      return res.status(404).json({ success: false, message: `Project '${projectName}' not found` });
    }

    res.json({ success: true, projectName: project.name, url: project.url || "No URL provided" });
  } catch (err) {
    console.error("Error fetching project URL:", err);
    res.status(500).json({ success: false, message: "Failed to fetch project URL", error: err.message });
  }
});

export default router;
