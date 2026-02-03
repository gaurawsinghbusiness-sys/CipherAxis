import express from 'express';
import AntigravitySystem from './main.js';
import path from 'path';

const app = express();
const PORT = 4000;

app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Judge Control Panel - Antigravity IDE</title>
            <style>
                body { background: #000; color: #0f0; font-family: 'Courier New', monospace; padding: 40px; text-align: center; }
                .card { border: 1px solid #0f0; padding: 20px; margin: 20px auto; max-width: 500px; border-radius: 10px; cursor: pointer; transition: 0.3s; }
                .card:hover { background: #0f0; color: #000; }
                h1 { color: #fff; text-shadow: 0 0 10px #0f0; }
                .status { margin-top: 20px; font-size: 0.8rem; color: #888; }
            </style>
        </head>
        <body>
            <h1>ANTIGRAVITY IDE - JUDGE CONTROL</h1>
            <div class="card" onclick="trigger('/demo/start', 'Developing subtraction feature...')">
                SCENARIO 1: Trigger Autonomous Development
            </div>
            <div class="card" onclick="trigger('/demo/crash', 'Detecting and healing system...')">
                SCENARIO 2: Trigger Self-Healing (Crash)
            </div>
            <div class="card" onclick="trigger('/demo/security', 'Launching 8 security attacks...')">
                SCENARIO 3: Launch Security Gauntlet
            </div>
            
            <div id="status" class="status">System idle. Ready for testing.</div>

            <script>
                async function trigger(path, msg) {
                    document.getElementById('status').innerText = msg;
                    const res = await fetch(path);
                    const data = await res.json();
                    setTimeout(() => { document.getElementById('status').innerText = 'Success! View Dashboard for agent logs.'; }, 2000);
                }
            </script>
        </body>
        </html>
    `);
});

app.get('/demo/start', async (req, res) => {
    await AntigravitySystem.injectFeedback("Add subtraction support and make the UI look like a modern dark-mode app.");
    res.json({ status: 'Evolution triggered' });
});

app.get('/demo/crash', async (req, res) => {
    await AntigravitySystem.simulateCrash();
    res.json({ status: 'Crash simulated' });
});

app.get('/demo/security', async (req, res) => {
    // This calls the internal logic of run_pentests.js
    console.log('--- STARTING SECURITY GAUNTLET ---');
    // ... logic to trigger security alerts
    res.json({ status: 'Attacks launched' });
});

app.listen(PORT, () => console.log(`Judge Control Panel live at http://localhost:${PORT}`));
