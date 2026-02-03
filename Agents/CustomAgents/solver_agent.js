import BaseAgent from './base_agent.js';
import orchestrator from './orchestrator.js';

class SolverAgent extends BaseAgent {
    constructor() {
        super('ARCHIMEDES', 'Feature & Fix Designer', 'gemini-2.5-flash-lite');
        // No longer listening for global Mission Start - PRIME handles that
    }

    async onMessage(sender, message) {
        if (message.type === 'MISSION_DIRECTIVE') {
            this.log(`Received directive from ${sender}. Analyzing specific instructions...`);
            const specificRequest = message.instructions?.ARCHIMEDES || message.originalRequest;
            
            const design = await this.designFeature(specificRequest);
            
            // Pass to Style Architect (PRISM)
            orchestrator.broadcast(this.name, {
                type: 'DESIGN_REQUEST',
                proposal: design,
                vibePreference: 'glassmorphism',
                directiveAnalysis: message.analysis // Pass the plan downstream
            });
        } else if (message.type === 'DIAGNOSIS') {
            this.log(`Received diagnosis from ${sender}. Proposing fix...`);
            const proposal = await this.proposeSolution(message.analysis);
            orchestrator.broadcast(this.name, {
                type: 'PROPOSAL',
                subject: 'SOLUTION_PROPOSAL',
                proposal: proposal,
                category: 'FIX'
            });
        } else if (message.type === 'PRIORITIZED_REQUEST') {
            this.log(`Received high-priority request: ${message.content}. Consulting Math Engine (Newton)...`);
            orchestrator.broadcast(this.name, {
                type: 'MATH_LOGIC_REQUEST',
                feature: message.content
            });
        } else if (message.type === 'MATH_AUDIT_PASSED') {
            this.log(`Math logic verified by Euler. Finalizing design...`);
            const design = await this.designFeature(`${message.originalRequest.feature} using this logic: ${message.spec}`);
            orchestrator.broadcast(this.name, {
                type: 'PROPOSAL',
                subject: 'FEATURE_PROPOSAL',
                proposal: design,
                category: 'FEATURE'
            });
        } else if (message.type === 'REVISION_REQUEST') {
            this.log(`Received revision request: ${message.reason}. Re-evaluating solution...`);
            const revisedProposal = await this.askAI(`The previous proposal failed review/testing. Reason: ${message.reason}. Provide a corrected version.`, 'You are a persistent debugger.', 'Marathon-Self-Correct');
            orchestrator.broadcast(this.name, {
                type: 'PROPOSAL',
                subject: 'REVISED_PROPOSAL',
                proposal: revisedProposal,
                category: 'FIX'
            });
        }
    }

    async proposeSolution(diagnosis) {
        const prompt = `Based on this diagnosis: "${diagnosis}", propose a specific code fix for the calculator app.
        
        STRUCTURE YOUR RESPONSE:
        1. THOUGHT_SIGNATURE: Brief logic overview
        2. PROBLEM: What is actually broken
        3. FIX: The specific code or logic change required
        4. IMPACT: How this fix affects other components`;
        
        return await this.askAI(prompt, 'You are a senior software architect focusing on structural stability.');
    }

    async designFeature(request) {
        const prompt = `Design a new feature for the calculator based on this user request: "${request}". 
        The current app is a simple 8-bit addition calculator.
        
        STRUCTURE YOUR DESIGN:
        1. THOUGHT_SIGNATURE: Strategic overview
        2. UI_REQUIREMENTS: Layout, buttons, and animations
        3. LOGIC_REQUIREMENTS: Math operations and state management
        4. EDGE_CASES: How to handle errors or limits`;
        
        return await this.askAI(prompt, 'You are a product designer and software engineer expert in LangChain orchestration.');
    }
}

export default new SolverAgent();
