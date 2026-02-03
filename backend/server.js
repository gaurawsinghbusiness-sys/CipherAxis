import express from "express";
import cors from "cors";
import morgan from "morgan";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { WebSocketServer } from "ws";
import http from "http";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Create HTTP server for both Express and WebSocket
const server = http.createServer(app);

// WebSocket server for real-time agent updates
const wss = new WebSocketServer({ server });

// Store connected clients
const clients = new Set();

wss.on("connection", (ws) => {
  console.log("[WebSocket] New client connected");
  clients.add(ws);
  
  // Send initial connection message
  ws.send(JSON.stringify({
    type: "CONNECTION",
    message: "Connected to CipherAxis Mission Control",
    timestamp: new Date().toISOString()
  }));

  ws.on("close", () => {
    clients.delete(ws);
    console.log("[WebSocket] Client disconnected");
  });
});

// Broadcast to all connected clients
export function broadcastToClients(data) {
  const message = JSON.stringify(data);
  clients.forEach((client) => {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(message);
    }
  });
}

app.use(cors());
app.use(express.json());

// Ensure logs directory exists
const logsDir = path.join(__dirname, "../logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

app.use(
  morgan("combined", {
    stream: fs.createWriteStream(path.join(logsDir, "access.log"), {
      flags: "a",
    }),
  }),
);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ 
    status: "healthy", 
    uptime: process.uptime(),
    agents: 20,
    websocketClients: clients.size
  });
});

// Agent logs endpoint (JSON format)
app.get("/api/agent-logs", (req, res) => {
  const agentLogPath = path.join(logsDir, "agents.log");
  
  if (!fs.existsSync(agentLogPath)) {
    return res.json({ logs: [], message: "No agent logs yet" });
  }
  
  const logData = fs.readFileSync(agentLogPath, "utf8");
  const logs = logData.split("\n")
    .filter(line => line.trim())
    .slice(-50) // Last 50 entries
    .map(line => {
      const match = line.match(/\[(.*?)\] \[(.*?)\] (.*)/);
      if (match) {
        return {
          timestamp: match[1],
          agent: match[2],
          message: match[3]
        };
      }
      return { raw: line };
    });
  
  res.json({ logs });
});

// Access logs endpoint
app.get("/api/logs", (req, res) => {
  const logPath = path.join(logsDir, "access.log");
  if (!fs.existsSync(logPath)) {
    return res.send("No logs yet");
  }
  const logData = fs.readFileSync(logPath, "utf8");
  res.send(logData);
});

// User feedback endpoint
app.post("/api/feedback", (req, res) => {
  const feedback = req.body;
  const feedbackDir = path.join(__dirname, "../feedback");
  
  if (!fs.existsSync(feedbackDir)) {
    fs.mkdirSync(feedbackDir, { recursive: true });
  }
  
  const feedbackPath = path.join(feedbackDir, "requests.json");
  let requests = [];
  if (fs.existsSync(feedbackPath)) {
    requests = JSON.parse(fs.readFileSync(feedbackPath, "utf8"));
  }
  
  const newFeedback = { ...feedback, timestamp: new Date().toISOString() };
  requests.push(newFeedback);
  fs.writeFileSync(feedbackPath, JSON.stringify(requests, null, 2));
  
  // Broadcast to connected clients
  broadcastToClients({
    type: "NEW_FEEDBACK",
    feedback: newFeedback
  });
  
  res.json({ message: "Feedback received", id: requests.length });
});

// Mission Control endpoint
app.post("/api/mission", (req, res) => {
  const { request } = req.body;
  console.log(`[Backend] Mission Received: ${request}`);
  
  // Broadcast to all clients (Dashboard + Agents)
  broadcastToClients({
    type: "MISSION_START",
    request: request,
    timestamp: new Date().toISOString()
  });
  
  res.json({ status: "mission_accepted", request });
});

// Agent Status Update endpoint
app.post("/api/agent-status-update", (req, res) => {
  const { agent, status } = req.body;
  broadcastToClients({
    type: "AGENT_STATUS_UPDATE",
    agent,
    status
  });
  res.json({ status: "updated" });
});

// Agent Log endpoint (for agents to report their activity)
app.post("/api/agent-log", (req, res) => {
  const { agent, message } = req.body;
  
  if (!agent || !message) {
    return res.status(400).json({ error: "Missing agent or message" });
  }

  const timestamp = new Date().toISOString();
  const logMsg = `[${timestamp}] [${agent}] ${message}\n`;
  
  // Write to agent log file
  const agentLogPath = path.join(logsDir, "agents.log");
  fs.appendFileSync(agentLogPath, logMsg);
  
  // Broadcast to all connected dashboard clients
  broadcastToClients({
    type: "AGENT_LOG",
    agent,
    message,
    timestamp
  });
  res.json({ status: "logged" });
});

// Agent error log endpoint
app.post("/api/error-log", (req, res) => {
  const { agent, message } = req.body;
  const timestamp = new Date().toISOString();
  const logMsg = `[${timestamp}] [${agent}] ERROR: ${message}\n`;
  
  // Write to error log file
  const errorLogPath = path.join(logsDir, "error.log");
  fs.appendFileSync(errorLogPath, logMsg);
  
  // Also write to the general agent log for the dashboard feed
  const agentLogPath = path.join(logsDir, "agents.log");
  fs.appendFileSync(agentLogPath, logMsg);
  
  // Broadcast to all connected dashboard clients with "error" type
  broadcastToClients({
    type: "AGENT_LOG",
    agent,
    message: `❌ ${message}`,
    timestamp,
    severity: 'error'
  });
  
  res.json({ status: "logged" });
});

app.post("/api/store-complaint", (req, res) => {
  const { complaint, user, timestamp } = req.body;
  
  // 1. Broadcast to agents (NEXUS will catch this to push to Google Sheets)
  broadcastToClients({
    type: "COMPLAINT_SUBMITTED",
    complaint,
    user,
    timestamp
  });

  // 2. Also log it to the system log
  const logMsg = `[${timestamp}] [SYSTEM] COMPLAINT RECEIVED from ${user}: "${complaint}"\n`;
  const logsDir = path.join(__dirname, "../logs");
  fs.appendFileSync(path.join(logsDir, "agents.log"), logMsg);

  res.json({ status: "complaint_received" });
});

app.get("/api/agent-status", (req, res) => {
  const agents = [
    { name: "ARGUS", status: "running", role: "Content Security" },
    { name: "CERBERUS", status: "running", role: "Behavioral Monitor" },
    { name: "ETHOS", status: "idle", role: "Ethics Guard" },
    { name: "KEY", status: "idle", role: "Identity Agent" },
    { name: "NEXUS", status: "idle", role: "Google Bridge" },
    { name: "ECHO", status: "idle", role: "Userbase Analyst" },
    { name: "NEWTON", status: "idle", role: "Math Engine" },
    { name: "EULER", status: "idle", role: "Precision Audit" },
    { name: "ARCHIMEDES", status: "idle", role: "Solver Agent" },
    { name: "PRISM", status: "idle", role: "Style Architect" },
    { name: "VULCAN", status: "idle", role: "Code Agent" },
    { name: "JUDGE", status: "idle", role: "Unit Test Agent" },
    { name: "SIGHT", status: "idle", role: "Browser Verification" },
    { name: "PRIME", status: "running", role: "Leader Agent" },
    { name: "NOVA", status: "idle", role: "Deploy Agent" },
    { name: "SENTINEL", status: "running", role: "Monitoring Agent" },
    { name: "MEDIC", status: "idle", role: "Diagnostic Agent" },
    { name: "ATLAS", status: "idle", role: "E2E Tester" },
    { name: "PHANTOM", status: "idle", role: "Stress Tester" },
    { name: "ORACLE", status: "idle", role: "Regression Tester" }
  ];
  res.json({ agents, total: agents.length });
});

// Google Sheets polling endpoint
app.get("/api/google-sheets-feedback", async (req, res) => {
  const sheetUrl = process.env.GOOGLE_SHEET_CSV_URL;
  
  if (!sheetUrl) {
    return res.json({ 
      error: "GOOGLE_SHEET_CSV_URL not configured",
      feedback: [] 
    });
  }
  
  try {
    const response = await fetch(sheetUrl);
    const csvData = await response.text();
    const rows = csvData.split("\n").slice(1);
    const feedback = rows
      .filter(row => row.trim())
      .map(row => {
        const [timestamp, content] = row.split(",");
        return { timestamp: timestamp?.trim(), content: content?.trim() };
      })
      .filter(f => f.content);
    
    res.json({ feedback, count: feedback.length });
  } catch (error) {
    res.json({ error: error.message, feedback: [] });
  }
});

// Serve frontend
app.use(express.static(path.join(__dirname, "../frontend")));

// Start server
server.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════╗
║      🚀 CipherAxis Backend Server Running         ║
╠═══════════════════════════════════════════════════╣
║  HTTP Server:    http://localhost:${PORT}            ║
║  WebSocket:      ws://localhost:${PORT}              ║
║  Health Check:   http://localhost:${PORT}/health     ║
║  Agent Logs:     http://localhost:${PORT}/api/agent-logs ║
║  Dashboard:      http://localhost:${PORT}/dashboard.html ║
╚═══════════════════════════════════════════════════╝
  `);
  console.log("[Backend] Server is ready. Health check available at /health");
  console.log("[Backend] Agents will initialize in 15 seconds...");

  // DELAYED agent initialization - wait 15s for Render health check to pass first
  setTimeout(async () => {
    try {
      console.log("[Backend] Initializing CipherAxis Agent System...");
      const system = (await import("../main.js")).default;
      console.log("[Backend] ✅ Agent system initialized successfully!");
    } catch (error) {
      console.error("[Backend] ❌ Failed to initialize CipherAxis System:", error.message);
    }
  }, 15000);
});

export default { app, server, broadcastToClients };
