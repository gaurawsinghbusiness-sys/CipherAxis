import BaseAgent from './base_agent.js';
import orchestrator from './orchestrator.js';

/**
 * PHANTOM - Stress Test Agent
 * Role: Performance & Load Testing
 * Intelligence: Gemini 1.5 Flash
 */
class PhantomAgent extends BaseAgent {
    constructor() {
        super('PHANTOM', 'Load & Stress Analyst', 'gemini-2.5-flash-lite');
        this.stressResults = [];
    }

    async onMessage(sender, message) {
        if (message.type === 'RUN_STRESS_TEST') {
            this.log('Initiating stress test...');
            
            const results = await this.runStressTest(message.config || {});
            
            orchestrator.broadcast(this.name, {
                type: 'STRESS_TEST_RESULTS',
                results: results,
                recommendation: this.generateRecommendation(results)
            });
        }
    }

    async runStressTest(config) {
        const {
            iterations = 100,
            concurrency = 10,
            testType = 'calculation'
        } = config;

        this.log(`Running stress test: ${iterations} iterations, ${concurrency} concurrent`);

        const results = {
            iterations,
            concurrency,
            testType,
            metrics: {
                avgResponseTime: 0,
                maxResponseTime: 0,
                minResponseTime: Infinity,
                errors: 0,
                successRate: 0
            },
            bottlenecks: []
        };

        // Simulate stress test
        const times = [];
        for (let i = 0; i < iterations; i++) {
            const start = performance.now();
            
            // Simulate operation
            const success = await this.simulateOperation(testType);
            
            const elapsed = performance.now() - start;
            times.push(elapsed);
            
            if (!success) results.metrics.errors++;
        }

        // Calculate metrics
        results.metrics.avgResponseTime = times.reduce((a, b) => a + b, 0) / times.length;
        results.metrics.maxResponseTime = Math.max(...times);
        results.metrics.minResponseTime = Math.min(...times);
        results.metrics.successRate = ((iterations - results.metrics.errors) / iterations) * 100;

        // Identify bottlenecks
        results.bottlenecks = await this.identifyBottlenecks(results.metrics);

        this.stressResults.push(results);
        return results;
    }

    async simulateOperation(type) {
        // Simulate different operation types
        switch (type) {
            case 'calculation':
                return Math.random() > 0.01; // 99% success rate
            case 'render':
                return Math.random() > 0.02; // 98% success rate
            case 'memory':
                return Math.random() > 0.05; // 95% success rate
            default:
                return true;
        }
    }

    async identifyBottlenecks(metrics) {
        const bottlenecks = [];
        
        if (metrics.avgResponseTime > 100) {
            bottlenecks.push('High average response time - consider optimization');
        }
        if (metrics.maxResponseTime > 500) {
            bottlenecks.push('Spike in max response time - check for blocking operations');
        }
        if (metrics.successRate < 99) {
            bottlenecks.push('Error rate above 1% - investigate failures');
        }
        
        return bottlenecks;
    }

    generateRecommendation(results) {
        if (results.metrics.successRate >= 99 && results.metrics.avgResponseTime < 50) {
            return 'EXCELLENT: System handles load well';
        } else if (results.metrics.successRate >= 95) {
            return 'GOOD: Minor optimizations recommended';
        } else {
            return 'WARNING: Performance issues detected';
        }
    }
}

export default new PhantomAgent();
