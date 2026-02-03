import BaseAgent from './base_agent.js';
import orchestrator from './orchestrator.js';

/**
 * NEXUS - Google Integration Agent
 * Role: Bridge to Google Sheets/Forms
 * Intelligence: Pure Logic + Gemini for parsing
 */
class GoogleIntegrationAgent extends BaseAgent {
    constructor() {
        super('NEXUS', 'Google Bridge', 'llama-3.3-70b-versatile');
        this.csvUrl = process.env.GOOGLE_SHEET_CSV_URL;
        this.webhookUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL || 'https://script.google.com/macros/s/AKfycbz_MOCK_WEBHOOK/exec';
        this.lastPollTime = new Date(); // Start from "now" to avoid re-processing old data
        this.feedbackCache = [];
        this.startAutonomousPolling();
    }

    startAutonomousPolling() {
        this.log('Initializing autonomous polling (Interval: 1 Hour)...');
        // For demo purposes, we might poll more frequently, but the instruction says "every hour"
        const HOURLY = 60 * 60 * 1000;
        setInterval(() => this.pollAndActivate(), HOURLY);
        
        // Immediate first poll
        setTimeout(() => this.pollAndActivate(), 5000);
    }

    async pollAndActivate() {
        const newEntries = await this.pollFeedback();
        
        for (const entry of newEntries) {
            const feedbackText = entry.feedback || entry.comment || entry.request;
            if (!feedbackText) continue;

            this.log(`Analyzing feedback for mission potential: "${feedbackText.substring(0, 30)}..."`);
            
            const analysis = await this.analyzeMissionPotential(feedbackText);
            
            if (analysis.isMission) {
                this.log(`🚀 AUTONOMOUS MISSION DETECTED: ${analysis.cleanMission}`);
                orchestrator.broadcast(this.name, {
                    type: 'MISSION_START',
                    request: analysis.cleanMission,
                    source: 'GOOGLE_SHEETS'
                });
            } else {
                this.log(`[FILTERED] Feedback ignored: ${analysis.reason}`);
            }
        }
    }

    async analyzeMissionPotential(text) {
        const prompt = `Analyze this user comment/feedback: "${text}"
        
        DETERMINE IF IT IS A VALID DEVELOPMENT REQUEST FOR A CALCULATOR.
        
        RULES:
        1. If it's a feature request (e.g., "Add history", "Make it blue"), return isMission: true.
        2. If it's a bug report (e.g., "Plus button doesn't work"), return isMission: true.
        3. If it's garbage, greeting, or unrelated (e.g., "Hi", "Pizza", "Build a boat"), return isMission: false.
        
        RESPOND IN JSON ONLY:
        {
          "isMission": boolean,
          "cleanMission": "The technical request extracted",
          "reason": "Why it was accepted or rejected"
        }`;

        const response = await this.askAI(prompt, 'You are a Mission Evaluator.');
        try {
            return JSON.parse(response.replace(/```json\n?|\n?```/g, ''));
        } catch {
            return { isMission: false, reason: "Parsing Error" };
        }
    }

    async onMessage(sender, message) {
        if (message.type === 'COMPLAINT_SUBMITTED') {
            this.log(`Received complaint for Google Sheets: "${message.complaint.substring(0, 30)}..."`);
            await this.pushToGoogleSheets(message);
        }
    }

    async pushToGoogleSheets(entry) {
        if (!this.webhookUrl || this.webhookUrl.includes('MOCK_WEBHOOK')) {
            this.log(`[SIMULATED] Successfully pushed to Google Sheet: "${entry.complaint}"`);
            return;
        }

        try {
            this.log('Piling complaint into Google Sheets via Webhook...');
            const response = await fetch(this.webhookUrl, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(entry)
            });
            this.log('✅ Complaint entry synchronized with Google Sheets.');
        } catch (error) {
            this.logError(`Failed to push to Google Sheets: ${error.message}`);
        }
    }

    async pollFeedback() {
        if (!this.csvUrl) {
            this.log('No Google Sheet CSV URL configured');
            return [];
        }

        this.log('Polling Google Sheets for new feedback...');
        
        try {
            const response = await fetch(this.csvUrl);
            const csvText = await response.text();
            const feedback = this.parseCSV(csvText);
            
            // Filter new feedback since last poll
            const newFeedback = this.filterNew(feedback);
            
            if (newFeedback.length > 0) {
                this.log(`Found ${newFeedback.length} new feedback entries`);
                
                for (const entry of newFeedback) {
                    orchestrator.broadcast(this.name, {
                        type: 'USER_FEEDBACK',
                        feedback: entry.feedback,
                        category: entry.category || 'general',
                        priority: entry.priority || 'normal',
                        timestamp: entry.timestamp
                    });
                }
            }
            
            this.lastPollTime = new Date();
            this.feedbackCache = feedback;
            
            return newFeedback;
        } catch (error) {
            this.log(`Error polling Google Sheets: ${error.message}`);
            return [];
        }
    }

    parseCSV(csvText) {
        const lines = csvText.trim().split('\n');
        if (lines.length < 2) return [];
        
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        
        return lines.slice(1).map(line => {
            const values = line.split(',');
            const entry = {};
            headers.forEach((header, i) => {
                entry[header] = values[i]?.trim() || '';
            });
            return entry;
        });
    }

    filterNew(feedback) {
        if (!this.lastPollTime) return feedback;
        
        return feedback.filter(entry => {
            const entryTime = new Date(entry.timestamp);
            return entryTime > this.lastPollTime;
        });
    }

    async categorizeFeedback(feedbackText) {
        const prompt = `Categorize this user feedback for a calculator app:
"${feedbackText}"

Categories: bug, feature, ui, performance, other
Respond with just the category.`;
        
        return await this.askAI(prompt, 'You are a product manager.');
    }
}

export default new GoogleIntegrationAgent();
