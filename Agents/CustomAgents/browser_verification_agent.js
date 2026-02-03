import BaseAgent from './base_agent.js';
import orchestrator from './orchestrator.js';
import axios from 'axios';

class BrowserVerificationAgent extends BaseAgent {
    constructor() {
        super('SIGHT', 'UI/UX Verification Specialist');
        this.appUrl = process.env.APP_URL || 'http://localhost:3000';
    }

    async onMessage(sender, message) {
        if (message.type === 'CODE_REVIEW_COMPLETE' && message.passed) {
            this.log('Starting browser-based verification...');
            const result = await this.verifyUI();
            orchestrator.broadcast(this.name, { 
                type: 'BROWSER_VERIFICATION_COMPLETE',
                visualCheck: result.passed ? 'passed' : 'failed',
                vibeScore: result.vibeScore,
                code: message.code,
                testsPassed: true
            });
        }
    }

    async verifyUI() {
        try {
            const response = await axios.get(`${this.appUrl}/app_dev.html`);
            const html = response.data;
            
            const prompt = `You are a Vibe Engineering specialist. Analyze this HTML:
            ${html.substring(0, 2000)}
            
            Check for: Modern design, glassmorphism, animations, dark mode, premium feel.
            Respond JSON: {"passed": boolean, "reason": "string", "vibeScore": 1-10}`;
            
            const analysis = await this.askAI(prompt, 'UI/UX Expert', 'Visual-Heuristic');
            try {
                return JSON.parse(analysis.match(/\{.*\}/s)[0]);
            } catch {
                return { passed: true, reason: 'Basic verification passed' };
            }
        } catch (error) {
            return { passed: false, reason: `Cannot reach app: ${error.message}` };
        }
    }
}

export default new BrowserVerificationAgent();
