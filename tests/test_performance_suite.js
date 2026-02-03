import phantom from '../Agents/CustomAgents/phantom_agent.js';
import oracle from '../Agents/CustomAgents/oracle_agent.js';

/**
 * 🧪 THE STRESS & REGRESSION RUNNER
 * This script executes Phase 5: Testing operations.
 */

async function runTests() {
    console.log(`
╔═══════════════════════════════════════════════════╗
║      🧪  RUNNING STRESS & REGRESSION (Phase 5)    ║
╚═══════════════════════════════════════════════════╝
    `);

    console.log("\n[TEST 3] Executing PHANTOM Stress Test...");
    const stressConfig = {
        iterations: 50,
        concurrency: 5,
        testType: 'calculation'
    };

    // PHANTOM is an agent, so we manually trigger its logic
    const results = await phantom.runStressTest(stressConfig);
    console.log("✅ Stress Test Complete.");
    console.log(`- Avg Time: ${results.metrics.avgResponseTime.toFixed(2)}ms`);
    console.log(`- Success Rate: ${results.metrics.successRate}%`);
    console.log(`- Bottlenecks: ${results.bottlenecks.join(', ') || 'None'}`);

    console.log("\n[TEST 4] Executing ORACLE Regression Check...");
    // Mocking a code change to check against Alfa1 baseline
    const mockNewCode = `
    <!DOCTYPE html>
    <html>
        <body>
            <h1>CipherAxis Calculator v2</h1>
            <!-- Missing a button from the baseline -->
            <button>1</button>
        </body>
    </html>`;

    const regression = await oracle.runRegressionTests(mockNewCode);
    console.log("✅ Regression Analysis Complete.");
    console.log(`- No Regressions: ${regression.noRegressions}`);
    console.log(`- Risk Level: ${regression.riskLevel}`);
    console.log(`- Observations: ${regression.changes.join(', ') || 'No significant changes'}`);

    console.log("\n[Testing] All performance runs completed.");
    process.exit(0);
}

runTests().catch(err => {
    console.error("Test Runner Failed:", err);
    process.exit(1);
});
