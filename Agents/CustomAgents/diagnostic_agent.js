import BaseAgent from './base_agent.js';
import orchestrator from './orchestrator.js';

/**
 * MEDIC - Diagnostic Agent
 * Role: Root Cause Analyst & Fix Suggester
 * Intelligence: Gemini 1.5 Flash
 */
class DiagnosticAgent extends BaseAgent {
    constructor() {
        super('MEDIC', 'Emergency Diagnostic', 'gemini-2.5-flash-lite');
    }

    async onMessage(sender, message) {
        if (message.type === 'SYSTEM_ALERT') {
            this.log(`Received ${message.severity} alert: ${message.message}`);
            const diagnosis = await this.diagnose(message);
            orchestrator.broadcast(this.name, {
                type: 'DIAGNOSIS',
                analysis: diagnosis.rootCause,
                suggestedFix: diagnosis.fix,
                confidence: diagnosis.confidence,
                affectedComponent: diagnosis.component
            });
        }
    }

    async diagnose(alert) {
        const logs = await this.getAppLogs();
        
        const prompt = `You are a senior SRE debugging a production issue.

ERROR: "${alert.message}"
SEVERITY: ${alert.severity}
LOGS: ${JSON.stringify(logs?.slice(-5) || [])}

Analyze and respond in JSON format:
{
  "rootCause": "specific cause",
  "component": "affected file or component",
  "fix": "step-by-step fix instructions",
  "confidence": "high/medium/low"
}`;

        const response = await this.askAI(prompt, 'You are an expert SRE. Output valid JSON only.');
        
        try {
            return JSON.parse(response.replace(/```json\n?|\n?```/g, ''));
        } catch {
            return {
                rootCause: response,
                component: 'unknown',
                fix: 'Manual analysis required',
                confidence: 'low'
            };
        }
    }

    async suggestFix(errorDetails) {
        const prompt = `Given this error: "${errorDetails}", suggest a code fix for a calculator web app. Be specific with HTML/CSS/JS.`;
        return await this.askAI(prompt, 'You are a debugging expert.');
    }
}

export default new DiagnosticAgent();
