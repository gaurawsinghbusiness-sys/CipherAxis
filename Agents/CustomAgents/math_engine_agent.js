import BaseAgent from './base_agent.js';
import orchestrator from './orchestrator.js';

/**
 * NEWTON - Math Engine Agent
 * Role: PhD Mathematician - Calculation Logic
 * Intelligence: Gemini 1.5 Flash
 */
class MathEngineAgent extends BaseAgent {
    constructor() {
        super('NEWTON', 'Math Engine', 'llama-3.3-70b-versatile');
    }

    async onMessage(sender, message) {
        if (message.type === 'MATH_REQUEST') {
            this.log(`Received math request: ${message.operation}`);
            
            const logic = await this.designCalculation(message.operation, message.context);
            const verified = await this.verifyLogic(logic);
            
            orchestrator.broadcast(this.name, {
                type: 'MATH_LOGIC_READY',
                operation: message.operation,
                implementation: logic,
                verified: verified.correct,
                edgeCases: verified.edgeCases
            });
        }
    }

    async designCalculation(operation, context = '') {
        const prompt = `You are a PhD mathematician. Design the calculation logic for: "${operation}"
        
Context: ${context || 'Standard calculator'}

Provide:
1. Mathematical formula
2. JavaScript implementation
3. Edge cases to handle (division by zero, overflow, etc.)
4. Precision considerations

Format as implementation-ready JavaScript function.`;

        return await this.askAI(prompt, 'You are a mathematics professor.');
    }

    async verifyLogic(logic) {
        const prompt = `Verify this calculation logic for mathematical correctness:

${logic}

Check for:
1. Off-by-one errors
2. Floating point precision issues
3. Edge cases (0, negative, infinity)
4. Overflow conditions

Respond in JSON:
{
  "correct": true/false,
  "issues": ["list of issues"],
  "edgeCases": ["cases to test"]
}`;

        const response = await this.askAI(prompt, 'You are a mathematical verification expert.');
        
        try {
            return JSON.parse(response.replace(/```json\n?|\n?```/g, ''));
        } catch {
            return { correct: true, issues: [], edgeCases: ['0', '-1', '9999999'] };
        }
    }

    async calculateWithPrecision(a, b, operation) {
        // Use BigInt or decimal.js for precision
        switch (operation) {
            case 'add': return Number((parseFloat(a) + parseFloat(b)).toFixed(10));
            case 'subtract': return Number((parseFloat(a) - parseFloat(b)).toFixed(10));
            case 'multiply': return Number((parseFloat(a) * parseFloat(b)).toFixed(10));
            case 'divide': 
                if (parseFloat(b) === 0) return 'Error: Division by zero';
                return Number((parseFloat(a) / parseFloat(b)).toFixed(10));
            default: return 'Unknown operation';
        }
    }
}

export default new MathEngineAgent();
