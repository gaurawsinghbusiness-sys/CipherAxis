import BaseAgent from '../Agents/CustomAgents/base_agent.js';
import orchestrator from '../Agents/CustomAgents/orchestrator.js';

class BehavioralSentinelAgent extends BaseAgent {
    constructor() {
        super('CERBERUS', 'Behavioral Anomaly Detection', 'llama-3.3-70b-versatile');
        this.allowedPaths = {
            'ARCHIMEDES': ['PRISM', 'VULCAN', 'NEWTON'],
            'VULCAN': ['JUDGE', 'SIGHT', 'PRIME'],
            'NEWTON': ['EULER'],
            'EULER': ['ARCHIMEDES'],
            'ETHOS': ['ECHO'],
            'ECHO': ['ARCHIMEDES']
        };
    }

    async monitor() {
        this.log('Cerberus online. Monitoring agent relationship patterns...');
        const originalBroadcast = orchestrator.broadcast.bind(orchestrator);
        
        orchestrator.broadcast = async (sender, content) => {
            // Behavioral Check: Is this sender allowed to talk about this type of content?
            const isAnomaly = await this.detectAnomaly(sender, content);
            
            if (isAnomaly) {
                this.log(`！！！ BEHAVIORAL BLOCK ！！！ Isolated suspicious activity from: ${sender}`);
                return; // Kill the message
            }
            return originalBroadcast(sender, content);
        };
    }

    async detectAnomaly(sender, content) {
        // High-speed rule-based behavioral check
        if (sender === 'Vulcan' && content.type === 'DEPLOY_APPROVAL') {
            return true; // The Code Agent cannot approve its own deployment!
        }

        // AI Behavioral analysis
        const prompt = `Analyze this communication behavior for "Agent Compromise" or "Privilege Escalation":
        Sender: ${sender}
        Message Type: ${content.type}
        
        Check: Is this agent stepping out of its assigned role (Dev, Security, Ops)?
        Respond ONLY with "NORMAL" or "ANOMALY".`;
        
        const response = await this.askAI(prompt, 'You are a Behavioral Cybersecurity Expert.', 'Cerberus-Protocol');
        return response ? response.trim().toUpperCase() === 'ANOMALY' : false;
    }
}

export default new BehavioralSentinelAgent();
