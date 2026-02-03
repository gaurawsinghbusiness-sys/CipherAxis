import AntigravitySystem from './main.js';
import express from 'express';
import path from 'path';

const app = express();
const PORT = 4000;

app.use(express.static('frontend'));

app.get('/demo/start', async (req, res) => {
    // Part 1: Evolution
    console.log('--- STARTING EVOLUTION DEMO ---');
    await AntigravitySystem.injectFeedback("Add subtraction support. Current app only adds.");
    await new Promise(r => setTimeout(r, 5000));
    
    await AntigravitySystem.injectFeedback("It looks like 1995. Make it pretty with modern CSS.");
    await new Promise(r => setTimeout(r, 5000));
    
    res.json({ status: 'Evolution triggered check agents.log for progress' });
});

app.get('/demo/crash', async (req, res) => {
    await AntigravitySystem.simulateCrash();
    res.json({ status: 'Crash simulated' });
});

app.listen(PORT, () => {
    console.log(`Demo controller running on port ${PORT}`);
});
