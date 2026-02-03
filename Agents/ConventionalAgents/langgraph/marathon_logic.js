import { StateGraph, END, Annotation } from "@langchain/langgraph";
import ConventionalBaseAgent from "../conventional_base_agent.js";

// --- CONVENTIONAL AGENTS (Groq-Powered) ---
const diagnosticDirector = new ConventionalBaseAgent("DiagnosticDirector", "Framework Logic Manager");
const solverDirector = new ConventionalBaseAgent("SolverDirector", "Framework Strategy Manager");
const codeDirector = new ConventionalBaseAgent("CodeDirector", "Framework Implementation Manager");
const auditDirector = new ConventionalBaseAgent("AuditDirector", "Framework Quality Manager");

// 1. Define the Shared State (The "Memory" of the Marathon)
const MarathonState = Annotation.Root({
  error_report: "",
  solution_proposal: "",
  generated_code: "",
  test_results: "",
  iterations: 0,
});

// 2. Define the Nodes (The Players)
// We use LLAMA-3.3-70B on Groq for orchestration logic to leverage 29 RPM
const runDiagnostic = async (state) => {
  console.log("[LangGraph] Node: DiagnosticDirector. Analyzing logs via Groq...");
  const diagnosis = await diagnosticDirector.askAI(`Analyze these system logs: "System failure detected"`); 
  return { error_report: diagnosis, iterations: state.iterations + 1 };
};

const runSolver = async (state) => {
  console.log("[LangGraph] Node: SolverDirector. Designing fix via Groq...");
  const proposal = await solverDirector.askAI(`Design a solution for: ${state.error_report}`);
  return { solution_proposal: proposal };
};

const runCoder = async (state) => {
  console.log("[LangGraph] Node: CodeDirector. Writing code via Groq...");
  const code = await codeDirector.askAI(`Write frontend code for this proposal: ${state.solution_proposal}`);
  return { generated_code: code };
};

const runTester = async (state) => {
  console.log("[LangGraph] Node: AuditDirector. Verifying via Groq...");
  const assessment = await auditDirector.askAI(`Does this code fix the error? Code: ${state.generated_code} Error: ${state.error_report}`);
  return { test_results: assessment.toLowerCase().includes("pass") ? "PASS" : "FAIL" };
};

// 3. Define the Router (The Decision Logic)
const shouldContinue = (state) => {
  if (state.test_results === "PASS" || state.iterations >= 3) {
    return END; // Stop if passed or tried too many times
  }
  return "diagnostic"; // Loop back to diagnostics if failed
};

// 4. Build the Graph
const workflow = new StateGraph(MarathonState)
  .addNode("diagnostic", runDiagnostic)
  .addNode("solver", runSolver)
  .addNode("coder", runCoder)
  .addNode("tester", runTester)
  .addEdge("__start__", "diagnostic")
  .addEdge("diagnostic", "solver")
  .addEdge("solver", "coder")
  .addEdge("coder", "tester")
  .addConditionalEdges("tester", shouldContinue);

// Export the compiled graph
export const marathonGraph = workflow.compile();

// Runner function for testing
export async function runMarathon(initialError = "System failure detected") {
  console.log("\n🏃 [LangGraph] Starting Marathon Bug Fix Loop...\n");
  const result = await marathonGraph.invoke({ 
    error_report: initialError,
    iterations: 0 
  });
  console.log("\n✅ [LangGraph] Marathon Complete. Iterations:", result.iterations);
  console.log("   Final Result:", result.test_results);
  return result;
}

console.log("[CipherAxis] LangGraph Marathon System Initialized.");
