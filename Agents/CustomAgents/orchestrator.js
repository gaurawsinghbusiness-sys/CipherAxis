class Orchestrator {
    constructor() {
        this.agents = {};
    }

    registerAgent(agent) {
        this.agents[agent.name] = agent;
        console.log(`[Orchestrator] Registered agent: ${agent.name}`);
    }

    async broadcast(sender, message) {
        console.log(`[Orchestrator] ${sender} broadcasting: ${message.type}`);
        for (const [name, agent] of Object.entries(this.agents)) {
            if (name !== sender && agent.onMessage) {
                await agent.onMessage(sender, message);
            }
        }
    }
}

export default new Orchestrator();
