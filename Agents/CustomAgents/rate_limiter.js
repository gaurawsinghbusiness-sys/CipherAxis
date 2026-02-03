class RateLimiter {
    constructor() {
        this.limits = {
            'gemini-3-flash': { maxRpm: 4, lastCallTimes: [], queue: [] },
            'gemini-2.5-flash-lite': { maxRpm: 10, lastCallTimes: [], queue: [] },
            'groq': { maxRpm: 29, lastCallTimes: [], queue: [] }
        };
        this.processing = { 
            'gemini-3-flash': false, 
            'gemini-2.5-flash-lite': false,
            'groq': false 
        };
    }

    async schedule(modelName, task) {
        let tier = 'gemini-2.5-flash-lite';
        if (modelName.includes('gemini-3')) tier = 'gemini-3-flash';
        if (modelName.toLowerCase().includes('llama') || modelName.toLowerCase().includes('mixtral') || modelName.toLowerCase().includes('groq')) tier = 'groq';
        
        return new Promise((resolve, reject) => {
            this.limits[tier].queue.push({ task, resolve, reject });
            this.processQueue(tier);
        });
    }

    async processQueue(tier) {
        if (this.processing[tier] || this.limits[tier].queue.length === 0) return;
        this.processing[tier] = true;

        const limitRef = this.limits[tier];

        while (limitRef.queue.length > 0) {
            const now = Date.now();
            limitRef.lastCallTimes = limitRef.lastCallTimes.filter(time => now - time < 60000);

            if (limitRef.lastCallTimes.length < limitRef.maxRpm) {
                const { task, resolve, reject } = limitRef.queue.shift();
                limitRef.lastCallTimes.push(now);
                try {
                    const result = await task();
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            } else {
                const waitTime = 60000 - (now - limitRef.lastCallTimes[0]) + 1000;
                const secondsToWait = Math.ceil(waitTime / 1000);
                
                console.log(`[RateLimiter:${tier}] ⚠️  Limit Reached. Cooling down for ${secondsToWait}s...`);
                
                for (let i = secondsToWait; i > 0; i -= 10) {
                    if (i < secondsToWait) {
                        console.log(`[RateLimiter:${tier}] ... Resuming in ${i}s`);
                    }
                    await new Promise(resolve => setTimeout(resolve, Math.min(10000, i * 1000)));
                }
            }
        }

        this.processing[tier] = false;
    }
}

export default new RateLimiter();
