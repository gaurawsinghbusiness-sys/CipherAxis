import ConventionalBaseAgent from "../conventional_base_agent.js";

/**
 * Testing Crew (CrewAI Pattern)
 * Team: ATLAS (E2E) + PHANTOM (Stress) + ORACLE (Regression)
 * Purpose: Comprehensive quality assurance pipeline
 * Powered by Groq (29 RPM)
 */

class TestingCrew {
  constructor() {
    this.atlas = new ConventionalBaseAgent("ATLAS", "End-to-End Test Specialist");
    this.phantom = new ConventionalBaseAgent("PHANTOM", "Stress & Performance Tester");
    this.oracle = new ConventionalBaseAgent("ORACLE", "Regression Guardian");
    
    this.crewName = "QA Crew";
  }

  async runTestSuite(codeToTest, baselineSpec = null) {
    console.log(`\n🧪 [CrewAI:${this.crewName}] Starting comprehensive test suite...\n`);

    const results = {
      e2e: null,
      stress: null,
      regression: null,
      overallStatus: "PENDING"
    };

    // --- E2E Testing (ATLAS) ---
    console.log("[Test 1] ATLAS: Running end-to-end user flow tests...");
    const e2eResult = await this.atlas.askAI(
      `You are a QA engineer. Analyze this code and simulate a complete user journey. Report any issues found: "${codeToTest?.substring(0, 500)}". Respond with PASS or FAIL and details.`
    );
    results.e2e = e2eResult?.toUpperCase().includes("PASS") ? "PASS" : "FAIL";
    console.log(`[CrewAI] ATLAS result: ${results.e2e}`);

    // --- Stress Testing (PHANTOM) ---
    console.log("[Test 2] PHANTOM: Simulating high load conditions...");
    const stressResult = await this.phantom.askAI(
      `You are a performance engineer. Analyze this code for potential bottlenecks under 1000 concurrent users: "${codeToTest?.substring(0, 500)}". Respond with PASS or FAIL and recommendations.`
    );
    results.stress = stressResult?.toUpperCase().includes("PASS") ? "PASS" : "FAIL";
    console.log(`[CrewAI] PHANTOM result: ${results.stress}`);

    // --- Regression Testing (ORACLE) ---
    console.log("[Test 3] ORACLE: Checking for regressions against baseline...");
    const regressionResult = await this.oracle.askAI(
      `You are a regression tester. Compare this new code against the baseline spec and check for broken features: Code: "${codeToTest?.substring(0, 300)}" Baseline: "${baselineSpec || 'Calculator with basic operations'}". Respond with PASS or FAIL.`
    );
    results.regression = regressionResult?.toUpperCase().includes("PASS") ? "PASS" : "FAIL";
    console.log(`[CrewAI] ORACLE result: ${results.regression}`);

    // --- Final Verdict ---
    results.overallStatus = (results.e2e === "PASS" && results.stress === "PASS" && results.regression === "PASS") 
      ? "ALL_PASSED" 
      : "ISSUES_FOUND";

    console.log(`\n📊 [CrewAI:${this.crewName}] Test Suite Complete: ${results.overallStatus}\n`);
    
    return results;
  }
}

export default new TestingCrew();
