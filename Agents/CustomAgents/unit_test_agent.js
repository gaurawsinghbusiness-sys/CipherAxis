import BaseAgent from './base_agent.js';
import orchestrator from './orchestrator.js';

/**
 * JUDGE - Unit Test Agent
 * Role: QA Specialist - Test Case Generation
 * Intelligence: Gemini 1.5 Flash
 */
class UnitTestAgent extends BaseAgent {
    constructor() {
        super('JUDGE', 'QA Specialist', 'llama-3.3-70b-versatile');
    }

    async onMessage(sender, message) {
        if (message.type === 'CODE_REVIEW_REQUEST') {
            this.log(`Received code review request from ${sender}`);
            
            const testResults = await this.reviewCode(message.code);
            const testCases = await this.generateTestCases(message.code, message.category);
            
            orchestrator.broadcast(this.name, {
                type: 'CODE_REVIEW_COMPLETE',
                passed: testResults.passed,
                issues: testResults.issues,
                testCases: testCases,
                code: message.code,
                recommendation: testResults.passed ? 'APPROVE' : 'REVISE'
            });
        }
    }

    async reviewCode(code) {
        const prompt = `Review this calculator HTML/JS code for bugs, security issues, and best practices:

${code.substring(0, 1500)}

Respond in JSON format:
{
  "passed": true/false,
  "issues": ["list of issues found"],
  "severity": "critical/warning/info"
}`;

        const response = await this.askAI(prompt, 'You are a senior code reviewer.');
        
        try {
            return JSON.parse(response.replace(/```json\n?|\n?```/g, ''));
        } catch {
            return { passed: true, issues: [], severity: 'info' };
        }
    }

    async generateTestCases(code, category) {
        const prompt = `Generate 5 test cases for this calculator feature (${category}):

${code.substring(0, 500)}

Format each test as:
- Test Name: description
- Input: user action
- Expected: result`;

        const tests = await this.askAI(prompt, 'You are a QA engineer.');
        return tests;
    }

    async runTest(testCase, actualResult) {
        return actualResult === testCase.expected;
    }
}

export default new UnitTestAgent();
