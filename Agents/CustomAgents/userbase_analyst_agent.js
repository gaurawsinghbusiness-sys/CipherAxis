import BaseAgent from './base_agent.js';
import orchestrator from './orchestrator.js';

/**
 * ECHO - Userbase Analyst Agent
 * Role: AI Product Manager - Priority Scoring
 * Intelligence: Gemini 3 Flash (Strategic)
 */
class UserbaseAnalystAgent extends BaseAgent {
    constructor() {
        super('ECHO', 'AI Product Manager', 'gemini-2.5-flash-lite');
        this.feedbackQueue = [];
        this.priorityWeights = {
            bug: 10,
            performance: 8,
            feature: 5,
            ui: 4,
            other: 2
        };
    }

    async onMessage(sender, message) {
        if (message.type === 'USER_FEEDBACK' || message.type === 'COMPLAINT_SUBMITTED') {
            const feedbackText = message.type === 'USER_FEEDBACK' ? message.feedback : message.complaint;
            this.log(`Received input from ${sender}: "${feedbackText.substring(0, 50)}..."`);
            
            // Score and queue the feedback
            const scored = await this.scoreFeedback({ ...message, feedback: feedbackText });
            this.feedbackQueue.push(scored);
            
            // If high priority, escalate immediately
            if (scored.score >= 8) {
                this.log(`HIGH PRIORITY: Escalating to ARCHIMEDES`);
                orchestrator.broadcast(this.name, {
                    type: 'PRIORITIZED_REQUEST',
                    request: scored.feedback,
                    category: scored.category,
                    score: scored.score,
                    analysis: scored.analysis
                });
            }
        }
    }

    async scoreFeedback(feedback) {
        const prompt = `Analyze this user feedback for a calculator app:

"${feedback.feedback}"

Respond in JSON:
{
  "category": "bug/feature/ui/performance/other",
  "urgency": 1-10,
  "impact": 1-10,
  "effort": 1-10,
  "summary": "one line summary"
}`;

        const response = await this.askAI(prompt, 'You are a product manager prioritizing features.');
        
        try {
            const analysis = JSON.parse(response.replace(/```json\n?|\n?```/g, ''));
            
            // Calculate priority score
            const baseWeight = this.priorityWeights[analysis.category] || 2;
            const score = Math.round((analysis.urgency * 0.4 + analysis.impact * 0.4 + (10 - analysis.effort) * 0.2) * baseWeight / 10);
            
            return {
                ...feedback,
                category: analysis.category,
                score: Math.min(10, score),
                analysis: analysis.summary
            };
        } catch {
            return {
                ...feedback,
                category: 'other',
                score: 5,
                analysis: 'Could not parse'
            };
        }
    }

    getTopPriorities(count = 5) {
        return this.feedbackQueue
            .sort((a, b) => b.score - a.score)
            .slice(0, count);
    }

    async generateRoadmap() {
        const top = this.getTopPriorities(10);
        const prompt = `Create a sprint roadmap from these prioritized items:\n${JSON.stringify(top)}`;
        return await this.askAI(prompt, 'You are a technical product manager.');
    }
}

export default new UserbaseAnalystAgent();
