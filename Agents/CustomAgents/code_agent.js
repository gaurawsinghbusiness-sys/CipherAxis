import BaseAgent from './base_agent.js';
import orchestrator from './orchestrator.js';

/**
 * VULCAN - Code Agent
 * Role: Full-Stack Developer
 * Intelligence: Gemini 3 Flash (Strategic)
 */
class CodeAgent extends BaseAgent {
    constructor() {
        super('VULCAN', 'Autonomous Developer', 'llama-3.3-70b-versatile');
    }

    async onMessage(sender, message) {
        if (message.type === 'STYLE_SPECS_READY') {
            this.log(`Received style specs from ${sender}. Generating code...`);
            
            const code = await this.generateCode(
                message.originalProposal?.proposal || message.proposal,
                message.styles
            );
            
            // Validate before sending for review
            const validation = this.validateSyntax(code);
            
            if (!validation.valid) {
                this.log(`Code validation failed: ${validation.error}. Regenerating...`);
                const fixedCode = await this.fixCode(code, validation.error);
                orchestrator.broadcast(this.name, {
                    type: 'CODE_REVIEW_REQUEST',
                    code: fixedCode,
                    category: message.originalProposal?.category || 'feature',
                    wasFixed: true
                });
            } else {
                orchestrator.broadcast(this.name, {
                    type: 'CODE_REVIEW_REQUEST',
                    code: code,
                    category: message.originalProposal?.category || 'feature'
                });
            }
        }
    }

    async generateCode(proposal, styles = '') {
        const prompt = `Generate a COMPLETE, production-ready HTML file for a calculator app.
        
        INPUT SPECS:
        ${proposal}
        
        STYLE SYSTEM:
        ${styles}
        
        ROBUSTNESS REQUIREMENTS:
        - Include error handling for math operations (Division by zero, Overflow).
        - Use modern JavaScript (ES6+).
        - Ensure accessible colors and contrast.
        - Output ONLY the <html>...</html> content. No markdown wrappers.`;

        return await this.askAI(prompt, 'You are an expert web developer specializing in robust, error-free UI code.');
    }

    validateSyntax(code) {
        // Check for basic HTML structure
        if (!code.includes('<html') && !code.includes('<!DOCTYPE')) {
            return { valid: false, error: 'Missing HTML structure' };
        }
        
        // Check for unclosed tags
        const openTags = (code.match(/<script/g) || []).length;
        const closeTags = (code.match(/<\/script>/g) || []).length;
        if (openTags !== closeTags) {
            return { valid: false, error: 'Unclosed script tags' };
        }
        
        // Check for syntax errors indicators
        if (code.includes('undefined') || code.includes('NaN')) {
            return { valid: false, error: 'Contains undefined/NaN values' };
        }
        
        return { valid: true };
    }

    async fixCode(code, error) {
        const prompt = `This HTML code has an issue: "${error}"\n\nFix it and return the corrected complete HTML:\n\n${code.substring(0, 2000)}`;
        return await this.askAI(prompt, 'You are a debugging expert. Fix the code.');
    }
}

export default new CodeAgent();
