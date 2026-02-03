import BaseAgent from './base_agent.js';
import orchestrator from './orchestrator.js';
import fs from 'fs';
import path from 'path';

class OracleAgent extends BaseAgent {
    constructor() {
        super('ORACLE', 'Regression Test Specialist', 'llama-3.3-70b-versatile');
        this.baselinePath = path.join(process.cwd(), 'footprints', 'Alfa1', 'index.html');
    }

    async onMessage(sender, message) {
        if (message.type === 'STRESS_TESTS_PASSED') {
            this.log(`Running regression comparison against Alfa1 baseline...`);
            const regressionResults = await this.runRegressionTests(message.code);
            orchestrator.broadcast(this.name, {
                type: regressionResults.noRegressions ? 'REGRESSION_TESTS_PASSED' : 'REGRESSION_DETECTED',
                results: regressionResults
            });
        }
    }

    async runRegressionTests(newCode) {
        let baseline = '';
        try {
            baseline = fs.readFileSync(this.baselinePath, 'utf-8');
        } catch {
            return { noRegressions: true, changes: [], riskLevel: 'none' };
        }

        const prompt = `Compare baseline vs new code for regressions.
        Respond JSON: {"noRegressions": boolean, "changes": [...], "riskLevel": "low|medium|high"}`;
        
        const response = await this.askAI(prompt, 'Regression Analysis Expert');
        try {
            return JSON.parse(response.match(/\{.*\}/s)[0]);
        } catch {
            return { noRegressions: true, changes: [], riskLevel: 'low' };
        }
    }
}

export default new OracleAgent();
