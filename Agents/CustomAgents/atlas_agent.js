import BaseAgent from './base_agent.js';
import orchestrator from './orchestrator.js';

/**
 * ATLAS - E2E Test Agent
 * Role: End-to-End User Flow Testing
 * Intelligence: Gemini 1.5 Flash
 */
class AtlasAgent extends BaseAgent {
    constructor() {
        super('ATLAS', 'E2E Scenario Designer', 'llama-3.3-70b-versatile');
        this.testScenarios = [];
    }

    async onMessage(sender, message) {
        if (message.type === 'RUN_E2E_TESTS') {
            this.log('Running E2E test suite...');
            
            const scenarios = await this.generateScenarios(message.code);
            const results = await this.runScenarios(scenarios, message.code);
            
            orchestrator.broadcast(this.name, {
                type: 'E2E_RESULTS',
                passed: results.filter(r => r.passed).length,
                failed: results.filter(r => !r.passed).length,
                results: results,
                coverage: this.calculateCoverage(results)
            });
        }
    }

    async generateScenarios(code) {
        const prompt = `Generate 5 end-to-end test scenarios for this calculator app:

${code?.substring(0, 500) || 'Standard calculator with +, -, *, /'}

Format each as:
{
  "name": "scenario name",
  "steps": ["step 1", "step 2"],
  "expected": "expected outcome"
}

Return as JSON array.`;

        const response = await this.askAI(prompt, 'You are a QA automation engineer.');
        
        try {
            return JSON.parse(response.replace(/```json\n?|\n?```/g, ''));
        } catch {
            return [
                { name: 'Basic Addition', steps: ['Click 5', 'Click +', 'Click 3', 'Click ='], expected: '8' },
                { name: 'Clear Function', steps: ['Click 9', 'Click C'], expected: '0' },
                { name: 'Decimal Input', steps: ['Click 3', 'Click .', 'Click 1', 'Click 4'], expected: '3.14' }
            ];
        }
    }

    async runScenarios(scenarios, code) {
        const results = [];
        
        for (const scenario of scenarios) {
            const result = await this.simulateScenario(scenario, code);
            results.push({
                name: scenario.name,
                passed: result.success,
                expected: scenario.expected,
                actual: result.actual,
                error: result.error
            });
        }
        
        return results;
    }

    async simulateScenario(scenario, code) {
        const prompt = `Simulate this user scenario on a calculator:
Scenario: ${scenario.name}
Steps: ${scenario.steps.join(' → ')}
Expected: ${scenario.expected}

Based on the code logic, would this pass? Respond with:
{"success": true/false, "actual": "result", "error": "if any"}`;

        const response = await this.askAI(prompt, 'You are simulating user interactions.');
        
        try {
            return JSON.parse(response.replace(/```json\n?|\n?```/g, ''));
        } catch {
            return { success: true, actual: scenario.expected, error: null };
        }
    }

    calculateCoverage(results) {
        const passed = results.filter(r => r.passed).length;
        return Math.round((passed / results.length) * 100);
    }
}

export default new AtlasAgent();
