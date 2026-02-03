import BaseAgent from './base_agent.js';
import orchestrator from './orchestrator.js';

/**
 * KEY - Identity Agent
 * Role: User Identity & Session Management
 * Intelligence: Pure Logic
 */
class IdentityAgent extends BaseAgent {
    constructor() {
        super('KEY', 'Identity Agent', 'gemini-2.5-flash-lite');
        this.sessions = new Map();
        this.userProfiles = new Map();
    }

    async onMessage(sender, message) {
        if (message.type === 'AUTH_REQUEST') {
            const session = await this.authenticate(message.credentials);
            orchestrator.broadcast(this.name, {
                type: 'AUTH_RESPONSE',
                success: session.valid,
                sessionId: session.id,
                user: session.user
            });
        }
    }

    async authenticate(credentials) {
        // In production, this would verify with Google OAuth
        const mockUser = {
            id: `user_${Date.now()}`,
            email: credentials?.email || 'guest@cipheraxis.com',
            role: 'user'
        };
        
        const sessionId = this.createSession(mockUser);
        
        return {
            valid: true,
            id: sessionId,
            user: mockUser
        };
    }

    createSession(user) {
        const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        this.sessions.set(sessionId, {
            userId: user.id,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
            user: user
        });
        
        this.log(`Created session ${sessionId} for ${user.email}`);
        return sessionId;
    }

    validateSession(sessionId) {
        const session = this.sessions.get(sessionId);
        
        if (!session) return { valid: false, reason: 'Session not found' };
        if (new Date() > session.expiresAt) {
            this.sessions.delete(sessionId);
            return { valid: false, reason: 'Session expired' };
        }
        
        return { valid: true, user: session.user };
    }

    getUserContext(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) return null;
        
        return {
            user: session.user,
            preferences: this.userProfiles.get(session.userId) || {},
            sessionAge: Date.now() - session.createdAt.getTime()
        };
    }

    updateUserPreferences(sessionId, preferences) {
        const session = this.sessions.get(sessionId);
        if (!session) return false;
        
        this.userProfiles.set(session.userId, {
            ...this.userProfiles.get(session.userId),
            ...preferences
        });
        
        return true;
    }

    logout(sessionId) {
        this.sessions.delete(sessionId);
        this.log(`Session ${sessionId} terminated`);
    }
}

export default new IdentityAgent();
