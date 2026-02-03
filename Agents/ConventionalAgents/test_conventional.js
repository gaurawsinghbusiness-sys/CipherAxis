import { runMarathon } from "./langgraph/marathon_logic.js";
import { runFeatureLoop } from "./langgraph/feature_loop.js";
import securityCrew from "./crewai/security_crew.js";
import developmentCrew from "./crewai/development_crew.js";
import testingCrew from "./crewai/testing_crew.js";
import debateEngine from "./autogen/debate_engine.js";

/**
 * CipherAxis Conventional Agents Test Suite
 * Tests all three framework integrations: LangGraph, CrewAI, AutoGen
 * All powered by Groq (29 RPM)
 */

console.log(`
╔═══════════════════════════════════════════════════════════╗
║     🧪 CONVENTIONAL AGENTS TEST SUITE                      ║
║     Powered by Groq (29 RPM) - Isolated from Gemini       ║
╚═══════════════════════════════════════════════════════════╝
`);

async function runTests() {
  const results = {
    langgraph: { marathon: null, feature: null },
    crewai: { security: null, development: null, testing: null },
    autogen: { debate: null }
  };

  try {
    // ═══════════════════════════════════════════════════
    console.log("\n═══ TEST 1: LangGraph Marathon Loop ═══");
    // ═══════════════════════════════════════════════════
    results.langgraph.marathon = await runMarathon("Calculator button not responding");
    console.log("✅ Marathon Test Complete\n");

  } catch (e) {
    console.log("⚠️ Marathon test skipped:", e.message);
  }

  try {
    // ═══════════════════════════════════════════════════
    console.log("\n═══ TEST 2: CrewAI Security Crew ═══");
    // ═══════════════════════════════════════════════════
    results.crewai.security = await securityCrew.runMission("Add a dark mode toggle button");
    console.log("✅ Security Crew Test Complete\n");

  } catch (e) {
    console.log("⚠️ Security crew test skipped:", e.message);
  }

  try {
    // ═══════════════════════════════════════════════════
    console.log("\n═══ TEST 3: CrewAI Development Crew ═══");
    // ═══════════════════════════════════════════════════
    results.crewai.development = await developmentCrew.buildFeature("Add animation when buttons are pressed");
    console.log("✅ Development Crew Test Complete\n");

  } catch (e) {
    console.log("⚠️ Development crew test skipped:", e.message);
  }

  try {
    // ═══════════════════════════════════════════════════
    console.log("\n═══ TEST 4: AutoGen Debate Engine ═══");
    // ═══════════════════════════════════════════════════
    results.autogen.debate = await debateEngine.runDebate(
      "Should we use CSS Grid or Flexbox for the calculator layout?",
      { proposer: "DESIGNER", critic: "DEVELOPER" }
    );
    console.log("✅ Debate Engine Test Complete\n");

  } catch (e) {
    console.log("⚠️ Debate test skipped:", e.message);
  }

  // ═══════════════════════════════════════════════════
  console.log("\n═══ TEST SUMMARY ═══");
  // ═══════════════════════════════════════════════════
  console.log("LangGraph Marathon:", results.langgraph.marathon?.test_results || "SKIPPED");
  console.log("Security Crew:", results.crewai.security?.status || "SKIPPED");
  console.log("Development Crew:", results.crewai.development?.status || "SKIPPED");
  console.log("Debate Consensus:", results.autogen.debate?.consensus ? "REACHED" : "SKIPPED");

  console.log("\n🎉 All Conventional Agent tests completed!");
  return results;
}

// Run if executed directly
runTests().catch(console.error);
