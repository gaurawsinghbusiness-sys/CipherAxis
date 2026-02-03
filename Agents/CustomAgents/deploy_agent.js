import BaseAgent from './base_agent.js';
import orchestrator from './orchestrator.js';
import fs from 'fs';
import path from 'path';

/**
 * NOVA - Deploy Agent
 * Role: Deployment Specialist with Verification
 * Intelligence: Pure Logic + Gemini for validation
 */
class DeployAgent extends BaseAgent {
    constructor() {
        super('NOVA', 'Deployment Specialist', 'gemini-2.5-flash-lite');
        this.deploymentHistory = [];
    }

    async onMessage(sender, message) {
        if (message.type === 'DEPLOY_APPROVAL') {
            this.log(`Received deployment approval from ${sender}`);
            
            // Validate code before deploy
            const isValid = await this.validateCode(message.code);
            
            if (!isValid.safe) {
                this.log(`BLOCKED: Code failed safety check - ${isValid.reason}`);
                orchestrator.broadcast(this.name, {
                    type: 'DEPLOY_REJECTED',
                    reason: isValid.reason
                });
                return;
            }
            
            // Backup current version
            await this.backup();
            
            // Deploy
            await this.deploy(message.code);
            
            orchestrator.broadcast(this.name, {
                type: 'CODE_DEPLOYED',
                version: this.deploymentHistory.length,
                timestamp: new Date().toISOString()
            });
        } else if (message.type === 'PRODUCTION_PUSH') {
            this.log('🚨 PRODUCTION PUSH INITIATED! Promoting Dev Sandbox to index.html...');
            await this.promoteToProduction();
            
            orchestrator.broadcast(this.name, {
                type: 'SYSTEM_NOTIFICATION',
                message: '🚀 SITE IS NOW LIVE! Dev changes merged to production.',
                severity: 'success'
            });
        }
    }

    async validateCode(code) {
        // Basic security checks
        const dangerousPatterns = ['eval(', 'document.cookie', 'localStorage.clear', 'onclick="'];
        for (const pattern of dangerousPatterns) {
            if (code.includes(pattern)) {
                return { safe: false, reason: `Contains dangerous pattern: ${pattern}` };
            }
        }
        
        // Check for valid HTML structure
        if (!code.includes('<!DOCTYPE html>') && !code.includes('<html')) {
            return { safe: false, reason: 'Missing valid HTML structure' };
        }
        
        return { safe: true };
    }

    async backup() {
        const frontendPath = path.join(process.cwd(), 'frontend', 'app_dev.html');
        const backupDir = path.join(process.cwd(), 'footprints', `backup_${Date.now()}`);
        
        try {
            if (fs.existsSync(frontendPath)) {
                fs.mkdirSync(backupDir, { recursive: true });
                fs.copyFileSync(frontendPath, path.join(backupDir, 'index.html'));
                this.log(`Backup created at ${backupDir}`);
            }
        } catch (error) {
            this.log(`Backup warning: ${error.message}`);
        }
    }

    async deploy(code) {
        const frontendPath = path.join(process.cwd(), 'frontend', 'app_dev.html');
        fs.writeFileSync(frontendPath, code);
        
        this.deploymentHistory.push({
            timestamp: new Date().toISOString(),
            size: code.length
        });
        
        this.log(`Successfully deployed (${code.length} bytes)`);
    }

    async rollback() {
        this.log('Rollback requested - restoring from footprints/Alfa1');
        const backupPath = path.join(process.cwd(), 'footprints', 'Alfa1', 'index.html');
        const frontendPath = path.join(process.cwd(), 'frontend', 'app_dev.html');
        
        if (fs.existsSync(backupPath)) {
            fs.copyFileSync(backupPath, frontendPath);
            this.log('Rollback complete');
            return true;
        }
        return false;
    }

    async promoteToProduction() {
        const devPath = path.join(process.cwd(), 'frontend', 'app_dev.html');
        const prodPath = path.join(process.cwd(), 'frontend', 'index.html');
        
        try {
            if (fs.existsSync(devPath)) {
                // Final backup of production before overwrite
                const backupDir = path.join(process.cwd(), 'footprints', 'pre_prod_backups');
                if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
                fs.copyFileSync(prodPath, path.join(backupDir, `prod_backup_${Date.now()}.html`));

                // Perform the push
                fs.copyFileSync(devPath, prodPath);
                this.log('SUCCESS: Dev sandbox pushed to production index.html');
            }
        } catch (error) {
            this.logError(`Promotion Error: ${error.message}`);
        }
    }
}

export default new DeployAgent();
