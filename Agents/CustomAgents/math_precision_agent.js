import BaseAgent from './base_agent.js';
import orchestrator from './orchestrator.js';

/**
 * EULER - Math Precision Agent
 * Role: Precision Auditor - Edge Case Detection
 * Intelligence: Pure Logic + Gemini for analysis
 */
class MathPrecisionAgent extends BaseAgent {
    constructor() {
        super('EULER', 'Precision Audit', 'llama-3.3-70b-versatile');
        this.edgeCases = [
            { name: 'Division by Zero', test: (a, b, op) => op === 'divide' && parseFloat(b) === 0 },
            { name: 'Infinity Result', test: (a, b, op) => !isFinite(this.calculate(a, b, op)) },
            { name: 'NaN Result', test: (a, b, op) => isNaN(this.calculate(a, b, op)) },
            { name: 'Overflow', test: (a, b, op) => Math.abs(this.calculate(a, b, op)) > Number.MAX_SAFE_INTEGER },
            { name: 'Precision Loss', test: (a, b, op) => this.hasPrecisionLoss(a, b, op) }
        ];
    }

    async onMessage(sender, message) {
        if (message.type === 'MATH_LOGIC_READY') {
            this.log(`Auditing math logic for: ${message.operation}`);
            
            const audit = await this.auditLogic(message.implementation);
            
            if (audit.passed) {
                orchestrator.broadcast(this.name, {
                    type: 'MATH_AUDIT_PASSED',
                    operation: message.operation,
                    implementation: message.implementation,
                    testedEdgeCases: audit.testedCases
                });
            } else {
                orchestrator.broadcast(this.name, {
                    type: 'MATH_AUDIT_FAILED',
                    issues: audit.issues,
                    fixes: audit.fixes
                });
            }
        }
    }

    async auditLogic(implementation) {
        const issues = [];
        const testedCases = [];
        const fixes = [];

        // Test common edge cases
        const testValues = [
            [0, 0], [0, 1], [1, 0],
            [-1, 1], [1, -1], [-1, -1],
            [0.1, 0.2], [0.3, 0.1],
            [Number.MAX_SAFE_INTEGER, 1],
            [Infinity, 1], [NaN, 1]
        ];

        for (const edgeCase of this.edgeCases) {
            for (const [a, b] of testValues) {
                for (const op of ['add', 'subtract', 'multiply', 'divide']) {
                    if (edgeCase.test(a, b, op)) {
                        testedCases.push(`${edgeCase.name}: ${a} ${op} ${b}`);
                        
                        // Check if implementation handles this
                        if (!implementation?.includes('isNaN') && edgeCase.name === 'NaN Result') {
                            issues.push(`Missing NaN handling for ${a} ${op} ${b}`);
                            fixes.push('Add isNaN() check before returning result');
                        }
                        if (!implementation?.includes('Infinity') && edgeCase.name === 'Infinity Result') {
                            issues.push(`Missing Infinity handling`);
                            fixes.push('Add isFinite() check');
                        }
                    }
                }
            }
        }

        return {
            passed: issues.length === 0,
            issues,
            fixes,
            testedCases
        };
    }

    calculate(a, b, op) {
        a = parseFloat(a);
        b = parseFloat(b);
        switch (op) {
            case 'add': return a + b;
            case 'subtract': return a - b;
            case 'multiply': return a * b;
            case 'divide': return a / b;
            default: return NaN;
        }
    }

    hasPrecisionLoss(a, b, op) {
        const result = this.calculate(a, b, op);
        // Check for floating point precision issues
        if (op === 'add' && a === 0.1 && b === 0.2) {
            return result !== 0.3; // Famous JS precision bug
        }
        return false;
    }

    async suggestPrecisionFix(operation) {
        const prompt = `How to handle floating-point precision for ${operation} in JavaScript? Provide a code solution.`;
        return await this.askAI(prompt, 'You are a numerical computing expert.');
    }
}

export default new MathPrecisionAgent();
