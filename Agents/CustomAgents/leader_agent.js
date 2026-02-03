import BaseAgent from './base_agent.js';
import orchestrator from './orchestrator.js';

/**
 * PRIME - Leader Agent
 * Role: Final Authority - Deployment Approval
 * Intelligence: Gemini 3 Flash (Strategic)
 */
class LeaderAgent extends BaseAgent {
    constructor() {
        super('PRIME', 'Final Authority', 'gemini-2.5-flash-lite');
        this.approvalHistory = [];
        this.listenForMissions(); // PRIME now handles initial intake analysis
    }

    async onMissionStart(request) {
        this.log(`🔍 [SCOPE_CHECK] Analyzing request: "${request}"`);
        
        const analysis = await this.analyzeMission(request);
        
        if (analysis.isOutOfScope) {
            this.logError(`MISSION REJECTED (Out of Scope): ${analysis.reason}`);
            return;
        }

        this.log(`✅ [PLAN] Priority: ${analysis.priority} | Primary Agent: ${analysis.primaryAgent}`);
        
        // Pass the decomposed directive to the system
        orchestrator.broadcast(this.name, {
            type: 'MISSION_DIRECTIVE',
            originalRequest: request,
            analysis: analysis,
            instructions: analysis.agentInstructions
        });
    }

    async analyzeMission(request) {
        const prompt = `ANALYZE THIS MISSION LIKE A TOP-TIER SRE/ARCHITECT: "${request}"
        
        STRICT RULES:
        1. We ONLY build and evolve the "CipherAxis Calculator".
        2. REJECT any mission that is NOT related to a calculator (e.g., building an image app, social network, etc.).
        3. ALLOW any styling, UI/UX improvements, CSS changes, or new math features IF they are for the Calculator.
        4. If valid, break it into technical tasks.
        
        RESPOND IN JSON ONLY:
        {
          "isOutOfScope": true/false,
          "reason": "If out of scope, explain why (else empty string)",
          "intent": "string",
          "priority": "PHASE_1/PHASE_2/PHASE_3",
          "primaryAgent": "ARCHIMEDES/PRISM/ARGUS",
          "agentInstructions": {
            "ARCHIMEDES": "Design specs for...",
            "PRISM": "Styling tokens for...",
            "VULCAN": "Implementation details for..."
          },
          "complexity": 1-10
        }`;

        const response = await this.askAI(prompt, 'You are PRIME, the intake orchestrator. Your job is to protect project scope and break down valid requests.', 'Hyper-Logic');
        
        try {
            return JSON.parse(response.replace(/```json\n?|\n?```/g, ''));
        } catch {
            return { 
                isOutOfScope: false,
                reason: "",
                intent: request, 
                priority: 'PHASE_1', 
                primaryAgent: 'ARCHIMEDES', 
                agentInstructions: { ARCHIMEDES: request },
                complexity: 5 
            };
        }
    }

    async onMessage(sender, message) {
        if (message.type === 'BROWSER_VERIFICATION_COMPLETE') {
            this.log(`Received verification from ${sender}. Making final decision...`);
            
            const decision = await this.makeDecision(message);
            
            if (decision.approved) {
                this.log('APPROVED for deployment');
                this.approvalHistory.push({
                    timestamp: new Date().toISOString(),
                    decision: 'APPROVED',
                    confidence: decision.confidence
                });
                
                orchestrator.broadcast(this.name, {
                    type: 'DEPLOY_APPROVAL',
                    code: message.code,
                    approvedBy: this.name,
                    confidence: decision.confidence,
                    notes: decision.notes
                });
            } else {
                this.log(`REJECTED: ${decision.reason}`);
                orchestrator.broadcast(this.name, {
                    type: 'DEPLOY_REJECTED',
                    reason: decision.reason,
                    suggestedFixes: decision.fixes
                });
            }
        }
    }

    async makeDecision(verificationResult) {
        const prompt = `You are the final authority for code deployment. 

VERIFICATION RESULTS:
- Visual Check: ${verificationResult.visualCheck || 'passed'}
- Test Results: ${verificationResult.testsPassed ? 'all passed' : 'some failed'}
- Code Quality: ${verificationResult.codeQuality || 'acceptable'}

CODE SAMPLE:
${verificationResult.code?.substring(0, 500) || 'Not provided'}

Make a deployment decision. Respond in JSON:
{
  "approved": true/false,
  "confidence": "high/medium/low",
  "reason": "explanation",
  "notes": "any additional notes",
  "fixes": ["suggested fixes if rejected"]
}`;

        const response = await this.askAI(prompt, 'You are a technical lead making deployment decisions.');
        
        try {
            return JSON.parse(response.replace(/```json\n?|\n?```/g, ''));
        } catch {
            return { approved: true, confidence: 'medium', reason: 'Default approval', notes: '', fixes: [] };
        }
    }

    getApprovalStats() {
        return {
            total: this.approvalHistory.length,
            approved: this.approvalHistory.filter(h => h.decision === 'APPROVED').length
        };
    }
}

export default new LeaderAgent();
