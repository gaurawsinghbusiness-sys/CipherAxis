import BaseAgent from './base_agent.js';
import orchestrator from './orchestrator.js';

/**
 * SENTINEL - Monitoring Agent
 * Role: 24/7 System Health Monitor
 * Intelligence: Pure Logic + Gemini for analysis
 */
class MonitoringAgent extends BaseAgent {
    constructor() {
        super('SENTINEL', 'System SRE', 'llama-3.3-70b-versatile');
        this.checkInterval = 60000; // 1 minute
        this.alertThresholds = {
            errorRate: 5,      // errors per minute
            responseTime: 2000  // ms
        };
    }

    async run() {
        this.log('Running comprehensive health check...');
        
        const health = await this.getAppHealth();
        const logs = await this.getAppLogs();
        
        // Parse logs for errors
        const errorCount = this.countErrors(logs);
        
        if (health.status === 'down') {
            this.log('CRITICAL: Application is down!');
            orchestrator.broadcast(this.name, {
                type: 'SYSTEM_ALERT',
                severity: 'critical',
                message: 'Application is down! Immediate attention required.',
                timestamp: new Date().toISOString()
            });
        } else if (errorCount > this.alertThresholds.errorRate) {
            this.log(`WARNING: High error rate detected (${errorCount}/min)`);
            orchestrator.broadcast(this.name, {
                type: 'SYSTEM_ALERT',
                severity: 'warning',
                message: `High error rate: ${errorCount} errors in last minute`,
                errorSample: logs?.slice(-3)
            });
        } else {
            this.log('System healthy. All services operational.');
        }
        
        return { status: health.status, errorCount };
    }

    countErrors(logs) {
        if (!logs || !Array.isArray(logs)) return 0;
        const oneMinuteAgo = Date.now() - 60000;
        return logs.filter(log => 
            log.level === 'error' && 
            new Date(log.timestamp).getTime() > oneMinuteAgo
        ).length;
    }

    async analyzePattern(logs) {
        const prompt = `Analyze these server logs for patterns, recurring issues, or concerning trends:\n${JSON.stringify(logs?.slice(-10))}`;
        return await this.askAI(prompt, 'You are an SRE expert analyzing system health.');
    }
}

export default new MonitoringAgent();
