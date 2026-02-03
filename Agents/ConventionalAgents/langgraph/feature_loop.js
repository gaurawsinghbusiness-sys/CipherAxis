import { StateGraph, END, Annotation } from "@langchain/langgraph";
import ConventionalBaseAgent from "../conventional_base_agent.js";

/**
 * Feature Development Loop
 * Flow: Feedback → Prioritize → Design → Implement → Test → Deploy
 * Powered by Groq (29 RPM)
 */

// --- GROQ-POWERED DIRECTORS ---
const feedbackDirector = new ConventionalBaseAgent("FeedbackDirector", "User Input Processor");
const priorityDirector = new ConventionalBaseAgent("PriorityDirector", "Task Prioritization");
const designDirector = new ConventionalBaseAgent("DesignDirector", "Feature Architecture");
const implementDirector = new ConventionalBaseAgent("ImplementDirector", "Code Generation");
const testDirector = new ConventionalBaseAgent("TestDirector", "Quality Verification");
const deployDirector = new ConventionalBaseAgent("DeployDirector", "Deployment Manager");

// 1. Define the Shared State
const FeatureState = Annotation.Root({
  user_feedback: "",
  priority_score: 0,
  feature_design: "",
  implementation: "",
  test_result: "",
  deployed: false,
  current_step: "",
});

// 2. Define the Nodes
const processFeedback = async (state) => {
  console.log("[LangGraph:Feature] Processing user feedback...");
  const analysis = await feedbackDirector.askAI(
    `Analyze this user feedback and extract the core feature request: "${state.user_feedback}"`
  );
  return { current_step: "feedback_processed", user_feedback: analysis };
};

const prioritizeTask = async (state) => {
  console.log("[LangGraph:Feature] Prioritizing feature...");
  const priority = await priorityDirector.askAI(
    `Rate this feature request priority (1-10) and explain: ${state.user_feedback}. Respond with just the number.`
  );
  const score = parseInt(priority.match(/\d+/)?.[0] || "5");
  return { priority_score: score, current_step: "prioritized" };
};

const designFeature = async (state) => {
  console.log("[LangGraph:Feature] Designing feature architecture...");
  const design = await designDirector.askAI(
    `Design the UI/UX and technical architecture for: ${state.user_feedback}`
  );
  return { feature_design: design, current_step: "designed" };
};

const implementFeature = async (state) => {
  console.log("[LangGraph:Feature] Implementing feature...");
  const code = await implementDirector.askAI(
    `Write the HTML/CSS/JS code to implement: ${state.feature_design}`
  );
  return { implementation: code, current_step: "implemented" };
};

const testFeature = async (state) => {
  console.log("[LangGraph:Feature] Testing implementation...");
  const result = await testDirector.askAI(
    `Review this code for bugs and edge cases: ${state.implementation.substring(0, 500)}... Does it pass? Answer PASS or FAIL.`
  );
  return { test_result: result.toUpperCase().includes("PASS") ? "PASS" : "FAIL", current_step: "tested" };
};

const deployFeature = async (state) => {
  console.log("[LangGraph:Feature] Deploying feature...");
  await deployDirector.askAI(`Confirm deployment readiness for feature: ${state.feature_design.substring(0, 200)}`);
  return { deployed: true, current_step: "deployed" };
};

// 3. Decision Logic
const shouldDeploy = (state) => {
  if (state.test_result === "PASS") {
    return "deploy";
  }
  return "design"; // Loop back to redesign if failed
};

// 4. Build the Graph
const featureWorkflow = new StateGraph(FeatureState)
  .addNode("feedback", processFeedback)
  .addNode("prioritize", prioritizeTask)
  .addNode("design", designFeature)
  .addNode("implement", implementFeature)
  .addNode("test", testFeature)
  .addNode("deploy", deployFeature)
  .addEdge("__start__", "feedback")
  .addEdge("feedback", "prioritize")
  .addEdge("prioritize", "design")
  .addEdge("design", "implement")
  .addEdge("implement", "test")
  .addConditionalEdges("test", shouldDeploy)
  .addEdge("deploy", END);

// Export
export const featureGraph = featureWorkflow.compile();

// Runner function
export async function runFeatureLoop(userFeedback) {
  console.log("\n🚀 [LangGraph] Starting Feature Development Loop...\n");
  const result = await featureGraph.invoke({ user_feedback: userFeedback });
  console.log("\n✅ [LangGraph] Feature Loop Complete:", result.current_step);
  return result;
}

console.log("[CipherAxis] LangGraph Feature Loop Initialized.");
