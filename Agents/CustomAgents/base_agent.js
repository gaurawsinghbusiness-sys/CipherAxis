import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import Groq from 'groq-sdk';
import dotenv from 'dotenv';
import axios from 'axios';
import { WebSocket } from 'ws';
import rateLimiter from './rate_limiter.js';

dotenv.config();

class BaseAgent {
    constructor(name, role, modelName = 'gemini-2.5-flash-lite', agentType = 'Custom') {
        this.name = name;
        this.role = role;
        this.modelName = modelName;
        this.agentType = agentType;
        this.status = 'idle';
        this.ws = null;
        
        // --- HYBRID INITIALIZATION ---
        const isGroqModel = this.isGroqModel(this.modelName);

        if (isGroqModel) {
            this.groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        } else {
            const apiKey = process.env.GEMINI_API_KEY;
            if (apiKey && apiKey !== 'YOUR_GEMINI_API_KEY' && apiKey.trim() !== '') {
                this.model = new ChatGoogleGenerativeAI({
                    model: this.modelName,
                    apiKey: apiKey,
                    maxRetries: 2,
                });
            }
        }
        
        this.memory = [];
        this.connectToMissionControl();
    }

    isGroqModel(name) {
        const lower = name.toLowerCase();
        return lower.includes('llama') || lower.includes('mixtral') || lower.includes('groq');
    }

    connectToMissionControl() {
        const port = process.env.PORT || 3000;
        this.ws = new WebSocket(`ws://localhost:${port}`);

        this.ws.on('open', () => {
            this.log(`CONNECTED to Mission Control Hub (v1.0)`);
        });

        this.ws.on('message', (data) => {
            try {
                const message = JSON.parse(data);
                
                // 1. Mission Control level triggers
                if (message.type === 'MISSION_START' && this.listenersEnabled) {
                    this.onMissionStart(message.request);
                }

                // 2. Generic Message/Event Bus
                this.onMessage(message.sender || 'SYSTEM', message);
            } catch (e) {}
        });

        this.ws.on('close', () => {
            setTimeout(() => this.connectToMissionControl(), 5000);
        });

        this.ws.on('error', () => {});
    }

    listenForMissions() {
        this.listenersEnabled = true;
    }

    async onMissionStart(request) {
        // Overridden by agents
    }

    async onMessage(sender, message) {
        // Overridden by agents to listen for specific broadcast events
    }

    async setStatus(newStatus) {
        this.status = newStatus;
        try {
            await axios.post(`http://localhost:${process.env.PORT || 3000}/api/agent-status-update`, {
                agent: this.name,
                status: newStatus
            });
        } catch (e) {}
    }

    async askAI(prompt, systemInstruction = '', thinkingLevel = 'Deep') {
        await this.setStatus('working');
        this.log(`Analyzing with ${this.modelName} [${thinkingLevel}]...`);

        try {
            if (this.isGroqModel(this.modelName)) {
                return await this.askGroq(prompt, systemInstruction);
            }

            if (!this.model) {
                this.log(`[DEMO MODE] Simulating ${this.modelName} analysis (No API Key)`);
                await new Promise(r => setTimeout(r, 2000));
                return `[SIMULATED] Response for: ${prompt}`;
            }

            const chatPrompt = ChatPromptTemplate.fromMessages([
                ["system", `${systemInstruction}\n\nSYSTEM ROLE: {role}\n1. Always provide a THOUGHT_SIGNATURE.\n2. Thinking Level: {level}`],
                ["placeholder", "{chat_history}"],
                ["human", "{input}"]
            ]);

            const chain = chatPrompt.pipe(this.model).pipe(new StringOutputParser());

            const result = await rateLimiter.schedule(this.modelName, async () => {
                const response = await chain.invoke({
                    role: this.role,
                    level: thinkingLevel,
                    chat_history: this.memory.slice(-5).map(m => m[1]), // Simple array for placeholder
                    input: prompt
                });
                
                this.updateMemory(prompt, response);
                return response;
            });
            
            this.log(`Analysis complete.`);
            await this.setStatus('idle');
            return result;
        } catch (error) {
            this.logError(`Intelligence Error (${this.modelName}): ${error.message}`);
            await this.setStatus('idle');
            return null;
        }
    }

    async askGroq(prompt, systemInstruction) {
        const result = await rateLimiter.schedule(this.modelName, async () => {
            const response = await this.groq.chat.completions.create({
                messages: [
                    { role: 'system', content: `${systemInstruction}\nRole: ${this.role}` },
                    { role: 'user', content: prompt }
                ],
                model: this.modelName.includes('llama') ? this.modelName : 'llama-3.3-70b-versatile',
            });
            const content = response.choices[0].message.content;
            this.updateMemory(prompt, content);
            return content;
        });
        await this.setStatus('idle');
        return result;
    }

    updateMemory(prompt, response) {
        this.memory.push(["human", prompt]);
        this.memory.push(["assistant", response]);
        if (this.memory.length > 10) this.memory = this.memory.slice(-10);
    }

    async log(message, severity = 'info') {
        const timestamp = new Date().toISOString();
        const logMsg = `[${timestamp}] [${this.name}] ${message}`;
        console.log(logMsg);

        try {
            const api = severity === 'error' ? 'api/error-log' : 'api/agent-log';
            await axios.post(`http://localhost:${process.env.PORT || 3000}/${api}`, {
                agent: this.name,
                message: message,
                severity
            });
        } catch (error) {
            // Fail silently
        }
    }

    async logError(message) {
        await this.log(message, 'error');
    }
}

export default BaseAgent;
