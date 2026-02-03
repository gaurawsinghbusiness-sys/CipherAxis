import BaseAgent from './base_agent.js';
import orchestrator from './orchestrator.js';

/**
 * PRISM - Style Architect Agent
 * Role: Vibe Engineer - Premium CSS & Animations
 * Intelligence: Gemini 3 Flash (Strategic)
 */
class StyleArchitectAgent extends BaseAgent {
    constructor() {
        super('PRISM', 'Vibe Engineer', 'llama-3.3-70b-versatile');
        this.stylePresets = {
            glassmorphism: 'background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.2);',
            neon: 'box-shadow: 0 0 20px currentColor; text-shadow: 0 0 10px currentColor;',
            minimal: 'border: none; box-shadow: 0 2px 10px rgba(0,0,0,0.1);'
        };
    }

    async onMessage(sender, message) {
        if (message.type === 'DESIGN_REQUEST') {
            this.log(`Received design request from ${sender}`);
            
            const styles = await this.generateStyles(message.proposal, message.vibePreference || 'glassmorphism');
            
            orchestrator.broadcast(this.name, {
                type: 'STYLE_SPECS_READY',
                styles: styles,
                originalProposal: message,
                colorPalette: this.extractColors(styles)
            });
        }
    }

    async generateStyles(proposal, vibe) {
        const prompt = `You are a world-class UI/UX designer creating premium calculator styles.

FEATURE: "${proposal}"
VIBE: ${vibe}
BASE PRESET: ${this.stylePresets[vibe] || this.stylePresets.glassmorphism}

Generate CSS with:
1. Modern color palette (dark theme preferred)
2. Smooth transitions (0.3s ease)
3. Hover effects for buttons
4. Micro-animations for interactions
5. Glassmorphism or neon effects
6. Mobile-responsive design

Output format: Complete CSS code only, no explanations.`;

        return await this.askAI(prompt, 'You are a premium UI designer.');
    }

    extractColors(css) {
        const colors = [];
        const colorRegex = /#[0-9a-fA-F]{3,6}|rgb\([^)]+\)|rgba\([^)]+\)|hsl\([^)]+\)/g;
        const matches = css.match(colorRegex) || [];
        return [...new Set(matches)].slice(0, 5);
    }

    async suggestAnimation(element) {
        const prompt = `Suggest a subtle, premium micro-animation for a calculator ${element}. Provide CSS @keyframes code.`;
        return await this.askAI(prompt, 'You are an animation specialist.');
    }
}

export default new StyleArchitectAgent();
