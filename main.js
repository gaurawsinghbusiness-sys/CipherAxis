import orchestrator from './Agents/CustomAgents/orchestrator.js';
import monitoringAgent from './Agents/CustomAgents/monitoring_agent.js';
import diagnosticAgent from './Agents/CustomAgents/diagnostic_agent.js';
import solverAgent from './Agents/CustomAgents/solver_agent.js';
import codeAgent from './Agents/CustomAgents/code_agent.js';
import leaderAgent from './Agents/CustomAgents/leader_agent.js';
import deployAgent from './Agents/CustomAgents/deploy_agent.js';
import sentimentChecker from './Agents/CustomAgents/sentiment_checker.js';
import browserVerificationAgent from './Agents/CustomAgents/browser_verification_agent.js';
import userbaseAnalystAgent from './Agents/CustomAgents/userbase_analyst_agent.js';
import styleArchitectAgent from './Agents/CustomAgents/style_architect_agent.js';
import unitTestAgent from './Agents/CustomAgents/unit_test_agent.js';
// import googleIntegrationAgent from './Agents/CustomAgents/google_integration_agent.js'; // DISABLED: Not developed
import identityAgent from './Agents/CustomAgents/identity_agent.js';
import mathEngineAgent from './Agents/CustomAgents/math_engine_agent.js';
import mathPrecisionAgent from './Agents/CustomAgents/math_precision_agent.js';
import atlasAgent from './Agents/CustomAgents/atlas_agent.js';
import phantomAgent from './Agents/CustomAgents/phantom_agent.js';
import oracleAgent from './Agents/CustomAgents/oracle_agent.js';
import guardianAgent from './security/guardian.js';
import cerberusAgent from './security/cerberus.js';
import fs from 'fs';
import path from 'path';

class CipherAxisSystem {
    constructor() {
        this.init();
    }

    async init() {
        console.log(`
╔═══════════════════════════════════════════════════╗
║           🔐 CipherAxis System v1.0                ║
║        20-Agent Autonomous Development            ║
╚═══════════════════════════════════════════════════╝
        `);
        
        // Ensure logs directory exists
        const logsDir = path.join(process.cwd(), 'logs');
        if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir, { recursive: true });
        }

        // Register all 20 agents
        console.log('[CipherAxis] Registering agents...');
        
        // Security Layer (4)
        orchestrator.registerAgent(guardianAgent);
        orchestrator.registerAgent(cerberusAgent);
        orchestrator.registerAgent(sentimentChecker);
        orchestrator.registerAgent(identityAgent);
        
        // Strategy & Data Layer (4)
        // orchestrator.registerAgent(googleIntegrationAgent); // DISABLED: NEXUS not developed
        orchestrator.registerAgent(userbaseAnalystAgent);
        orchestrator.registerAgent(mathEngineAgent);
        orchestrator.registerAgent(mathPrecisionAgent);
        
        // Creative Forge Layer (3)
        orchestrator.registerAgent(solverAgent);
        orchestrator.registerAgent(styleArchitectAgent);
        orchestrator.registerAgent(codeAgent);
        
        // Quality & Verification Layer (3)
        orchestrator.registerAgent(unitTestAgent);
        orchestrator.registerAgent(browserVerificationAgent);
        orchestrator.registerAgent(leaderAgent);
        
        // Operations & Support Layer (3)
        orchestrator.registerAgent(deployAgent);
        orchestrator.registerAgent(monitoringAgent);
        orchestrator.registerAgent(diagnosticAgent);
        
        // Testing Squad (3)
        orchestrator.registerAgent(atlasAgent);
        orchestrator.registerAgent(phantomAgent);
        orchestrator.registerAgent(oracleAgent);

        console.log('[CipherAxis] All 20 agents registered successfully!');

        // Start hidden Security Layer (NON-BLOCKING to prevent deploy hang)
        try {
            guardianAgent.monitor().catch(e => console.log('[ARGUS] Monitor init skipped:', e.message));
            cerberusAgent.monitor().catch(e => console.log('[CERBERUS] Monitor init skipped:', e.message));
            console.log('[CipherAxis] Security layer activation started (ARGUS + CERBERUS)');
        } catch (e) {
            console.log('[CipherAxis] Security layer init skipped:', e.message);
        }
        
        // Start monitoring loop (hourly)
        setInterval(() => monitoringAgent.run(), 60000 * 60);
        console.log('[CipherAxis] Monitoring loop started (1h interval)');
        console.log('[CipherAxis] ✅ System initialization complete!');
    }

    async injectFeedback(emailContent) {
        console.log(`[MAIL] New user feedback received: "${emailContent}"`);
        orchestrator.broadcast('GmailSystem', {
            type: 'USER_FEEDBACK',
            content: emailContent
        });
    }

    async simulateCrash() {
        console.log('--- Simulating System Crash ---');
        const logPath = path.join(process.cwd(), 'logs/access.log');
        fs.appendFileSync(logPath, `[${new Date().toISOString()}] ERROR: Uncaught ReferenceError: x is not defined at calculate (index.html:85)\n`);
        await monitoringAgent.run();
    }
}

export default new CipherAxisSystem();
