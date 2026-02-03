import BaseAgent from '../CustomAgents/base_agent.js';

class ConventionalBaseAgent extends BaseAgent {
    constructor(name, role, modelName = 'llama-3.3-70b-versatile') {
        // Force agentType to 'Conventional' for strict security isolation
        super(name, role, modelName, 'Conventional');
    }
}

export default ConventionalBaseAgent;
