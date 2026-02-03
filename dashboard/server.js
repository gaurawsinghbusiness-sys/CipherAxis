import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());

app.get('/api/status', (req, res) => {
    const agentsLog = fs.readFileSync(path.join(__dirname, '../logs/agents.log'), 'utf8');
    const logs = agentsLog.split('\n').filter(Boolean).slice(-20);
    res.json({ logs });
});

// A simple dashboard HTML
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Antigravity Dashboard</title>
            <style>
                body { background: #1a1a1a; color: #fff; font-family: sans-serif; padding: 20px; }
                .log-box { background: #000; padding: 15px; border-radius: 5px; height: 500px; overflow-y: auto; font-family: monospace; }
                .log-entry { margin-bottom: 5px; border-bottom: 1px solid #333; padding-bottom: 2px; }
                .GuardianAgent { color: #f00; font-weight: bold; }
                .LeaderAgent { color: #0f0; }
                .SentimentCheckerAgent { color: #ff0; }
                h1 { color: #00ffff; }
            </style>
        </head>
        <body>
            <h1>Antigravity IDE - Agent Activity</h1>
            <div id="logs" class="log-box"></div>
            <script>
                async function fetchLogs() {
                    const res = await fetch('/api/status');
                    const data = await res.json();
                    const container = document.getElementById('logs');
                    container.innerHTML = data.logs.map(log => {
                        const agentMatch = log.match(/\\[([^\\]]+)\\]/g);
                        const agentClass = agentMatch && agentMatch[1] ? agentMatch[1].replace(/[\\[\\]]/g, '') : '';
                        return \`<div class="log-entry \${agentClass}">\${log}</div>\`;
                    }).join('');
                    container.scrollTop = container.scrollHeight;
                }
                setInterval(fetchLogs, 2000);
            </script>
        </body>
        </html>
    `);
});

app.listen(PORT, () => console.log(`Dashboard running on port ${PORT}`));
