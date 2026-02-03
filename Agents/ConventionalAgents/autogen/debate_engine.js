import ConventionalBaseAgent from "../conventional_base_agent.js";

/**
 * Debate Engine (AutoGen Pattern)
 * Purpose: Two agents argue back and forth until consensus
 * Use Case: Code review, design decisions, solution validation
 * Powered by Groq (29 RPM)
 */

class DebateEngine {
  constructor() {
    this.maxRounds = 5;
  }

  /**
   * Run a debate between two agents
   * @param {string} topic - The subject of debate
   * @param {Object} agents - { proposer: name, critic: name }
   * @param {string} context - Additional context for the debate
   */
  async runDebate(topic, agents = null, context = "") {
    const proposer = new ConventionalBaseAgent(
      agents?.proposer || "VULCAN", 
      "Solution Proposer"
    );
    const critic = new ConventionalBaseAgent(
      agents?.critic || "JUDGE", 
      "Critical Reviewer"
    );

    console.log(`\n💬 [AutoGen] Starting Debate: "${topic.substring(0, 50)}..."\n`);
    console.log(`   Proposer: ${proposer.name} | Critic: ${critic.name}\n`);

    const debateHistory = [];
    let consensus = false;
    let finalSolution = null;

    for (let round = 1; round <= this.maxRounds && !consensus; round++) {
      console.log(`📢 [Round ${round}/${this.maxRounds}]`);

      // --- PROPOSER'S TURN ---
      const proposerContext = round === 1 
        ? `${context}\n\nPropose a solution for: "${topic}"`
        : `Previous criticism: "${debateHistory[debateHistory.length - 1]?.criticism}"\n\nRevise your proposal to address this criticism.`;

      const proposal = await proposer.askAI(
        `You are proposing a solution. ${proposerContext}. Provide a clear, implementable solution.`
      );
      
      console.log(`   [${proposer.name}] Proposed solution (${proposal?.length || 0} chars)`);
      debateHistory.push({ round, proposer: proposer.name, proposal: proposal?.substring(0, 200) });

      // --- CRITIC'S TURN ---
      const critique = await critic.askAI(
        `You are a critical reviewer. Analyze this proposal:\n"${proposal?.substring(0, 500)}"\n\nIf the solution is complete and correct, respond with "APPROVED". Otherwise, provide specific criticism for improvement.`
      );

      console.log(`   [${critic.name}] ${critique?.toUpperCase().includes("APPROVED") ? "✅ APPROVED" : "🔄 Revision requested"}`);
      
      if (critique?.toUpperCase().includes("APPROVED")) {
        consensus = true;
        finalSolution = proposal;
        debateHistory.push({ round, critic: critic.name, verdict: "APPROVED" });
      } else {
        debateHistory.push({ round, critic: critic.name, criticism: critique?.substring(0, 200) });
      }
    }

    console.log(`\n🏁 [AutoGen] Debate Complete. Consensus: ${consensus ? "REACHED" : "NOT REACHED"}\n`);

    return {
      topic,
      rounds: debateHistory.length / 2,
      consensus,
      finalSolution: finalSolution?.substring(0, 500),
      history: debateHistory
    };
  }

  /**
   * Quick code review debate
   */
  async reviewCode(code, requirements) {
    return this.runDebate(
      `Review this code against requirements`,
      { proposer: "DEVELOPER", critic: "REVIEWER" },
      `Code:\n${code?.substring(0, 300)}\n\nRequirements: ${requirements}`
    );
  }

  /**
   * Architecture decision debate
   */
  async debateArchitecture(proposal) {
    return this.runDebate(
      `Evaluate architecture proposal`,
      { proposer: "ARCHITECT", critic: "SECURITY_EXPERT" },
      `Architecture: ${proposal}`
    );
  }
}

export default new DebateEngine();
