import ConventionalBaseAgent from "../conventional_base_agent.js";

/**
 * Development Crew (CrewAI Pattern)
 * Team: ARCHIMEDES (Solver) + PRISM (Style) + VULCAN (Code)
 * Purpose: Collaborative feature development with automatic delegation
 * Powered by Groq (29 RPM)
 */

class DevelopmentCrew {
  constructor() {
    this.archimedes = new ConventionalBaseAgent("ARCHIMEDES", "Problem Solver & Architect");
    this.prism = new ConventionalBaseAgent("PRISM", "Style & UI/UX Designer");
    this.vulcan = new ConventionalBaseAgent("VULCAN", "Code Implementer");
    
    this.crewName = "Forge Crew";
  }

  async buildFeature(featureRequest) {
    console.log(`\n🔨 [CrewAI:${this.crewName}] Starting collaborative feature build...\n`);

    // --- PHASE 1: Problem Solving (ARCHIMEDES) ---
    console.log("[Phase 1] ARCHIMEDES: Analyzing problem and designing solution...");
    const solution = await this.archimedes.askAI(
      `You are a senior software architect. Analyze this feature request and design a technical solution with clear implementation steps: "${featureRequest}"`
    );
    console.log("[CrewAI] ✅ ARCHIMEDES completed solution design.");

    // --- PHASE 2: UI/UX Design (PRISM) ---
    console.log("[Phase 2] PRISM: Creating visual design specifications...");
    const design = await this.prism.askAI(
      `You are a UI/UX designer. Based on this solution, create a visual design specification with colors, layout, and animations: "${solution?.substring(0, 500)}"`
    );
    console.log("[CrewAI] ✅ PRISM completed visual design.");

    // --- PHASE 3: Code Implementation (VULCAN) ---
    console.log("[Phase 3] VULCAN: Writing production code...");
    const code = await this.vulcan.askAI(
      `You are a senior frontend developer. Write clean HTML/CSS/JavaScript code implementing this design: "${design?.substring(0, 500)}". Use modern best practices.`
    );
    console.log("[CrewAI] ✅ VULCAN completed code implementation.");

    console.log(`\n🎉 [CrewAI:${this.crewName}] Feature build complete!\n`);
    
    return {
      featureRequest,
      solution: solution?.substring(0, 300),
      design: design?.substring(0, 300),
      code: code?.substring(0, 500),
      status: "COMPLETE"
    };
  }
}

export default new DevelopmentCrew();
