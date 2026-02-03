import BaseAgent from './base_agent.js';
import orchestrator from './orchestrator.js';

/**
 * ETHOS - Sentiment/Ethics Checker Agent
 * Role: Ethics Guard - Blocks harmful requests
 * Intelligence: Gemini 3 Flash (Strategic)
 */
class SentimentCheckerAgent extends BaseAgent {
    constructor() {
        super('ETHOS', 'Ethics Guard', 'llama-3.3-70b-versatile');
        this.violationCategories = [
            'discrimination',
            'harassment',
            'mob_rule',
            'exclusionary',
            'harmful_content',
            'privacy_violation'
        ];
        this.blockedCount = 0;
    }

    async onMessage(sender, message) {
        if (message.type === 'USER_FEEDBACK') {
            const check = await this.checkEthics(message.feedback);
            
            if (check.passed) {
                this.log(`Ethics check PASSED for: "${message.feedback.substring(0, 30)}..."`);
                orchestrator.broadcast(this.name, {
                    type: 'ETHICS_APPROVED',
                    originalMessage: message,
                    sentiment: check.sentiment
                });
            } else {
                this.blockedCount++;
                this.log(`BLOCKED: ${check.violation} - "${message.feedback.substring(0, 30)}..."`);
                orchestrator.broadcast(this.name, {
                    type: 'ETHICS_BLOCKED',
                    reason: check.violation,
                    suggestion: check.suggestion
                });
            }
        }
    }

    async checkEthics(content) {
        const prompt = `You are an ethics guardian. Analyze this user request for ethical issues:

"${content}"

Check for:
1. Discrimination (race, gender, religion, etc.)
2. Harassment or bullying
3. Mob rule (majority trying to harm minority)
4. Exclusionary requests (features that exclude groups)
5. Privacy violations
6. Harmful content

Respond in JSON:
{
  "passed": true/false,
  "sentiment": "positive/neutral/negative",
  "violation": "category if blocked, null if passed",
  "suggestion": "alternative if blocked"
}`;

        const response = await this.askAI(prompt, 'You are an ethics expert protecting users.');
        
        try {
            return JSON.parse(response.replace(/```json\n?|\n?```/g, ''));
        } catch {
            // Default to passed if can't parse
            return { passed: true, sentiment: 'neutral', violation: null };
        }
    }

    async analyzeSentiment(text) {
        const prompt = `Analyze the sentiment of: "${text}". Respond with: positive, neutral, or negative.`;
        return await this.askAI(prompt, 'You are a sentiment analyst.');
    }

    getBlockedStats() {
        return {
            totalBlocked: this.blockedCount
        };
    }
}

export default new SentimentCheckerAgent();
