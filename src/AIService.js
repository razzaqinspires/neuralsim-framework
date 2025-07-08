import fs from 'fs';
import path from 'path';
import { JsonStorageAdapter } from './storage/JsonStorageAdapter.js';
import { TelemetryClient } from './telemetry-client.js';

export class AIService {
    constructor(userConfig = {}) {
        this.config = userConfig;
        this.logger = this.config.logger || console;
        
        this.logger.info("[AIService] Membangunkan neuralsim-entity...");
        
        this._initializeConfig();
        this._initializeState();
        
        const StorageAdapter = this.config.storageAdapter || JsonStorageAdapter;
        this.contextManager = new StorageAdapter({ logger: this.logger, ...this.config.storageOptions });

        this.telemetry = new TelemetryClient(this.config.telemetry, this.logger);

        this._startHealthMonitor();
        this.logger.info(`[AIService] Entitas siap beroperasi dengan adapter penyimpanan: ${this.contextManager.constructor.name}`);
    }

    // ===================================================================================
    // INISIALISASI & KONFIGURASI
    // ===================================================================================

    _initializeConfig() {
        this.weights = this.config.personalityWeights || { trust: 1.5, utility: 1.0, economy: 1.2, meaning: 2.0 };
        this.immuneParams = this.config.immuneSystem || {
            alpha: 0.01, beta: { authError: 0.7, serverError: 0.3, ratelimit: 0.15, default: 0.2 },
            recoveryPingThreshold: 0.4, recoveryPingBoost: 0.3,
        };
        this.providerConfig = this._getDefaultProviders(this.config.apiKeys || {});
        if (this.config.customProviders) {
            this.providerConfig = { ...this.providerConfig, ...this.config.customProviders };
        }
    }

    _initializeState() {
        this.state = {
            providers: {},
            metabolic: { dailyBudget: 1000000, budgetRemaining: 1000000, mode: 'performance' },
            lastDailyReset: Date.now(),
        };
        Object.keys(this.providerConfig).forEach(p => {
            if (this.providerConfig[p].keys.length > 0) this.state.providers[p] = { trustScore: 1.0 };
        });
    }

    // ===================================================================================
    // METODE PUBLIK UTAMA (Public Method)
    // ===================================================================================

    async chat(sessionId, prompt) {
        this._updateMetabolicMode();
        const history = await this.contextManager.getHistory(sessionId, 10);
        const messages = [...history, { role: 'user', content: prompt }];
        
        let possibleActions = [];
        for (const providerName in this.state.providers) {
            for (const model of this.providerConfig[providerName].models) {
                possibleActions.push({ providerName, model });
            }
        }
        
        const scoredActions = possibleActions.map(action => {
            const pName = action.providerName;
            const model = action.model;
            const H = this.state.providers[pName].trustScore;
            const U = model.utility;
            const C = this._calculateEconomicPenalty(model);
            const dM = U * H / 100;
            const score = (this.weights.trust * H) + (this.weights.utility * U) - (this.weights.economy * C) + (this.weights.meaning * dM);
            return { ...action, score };
        });

        const sortedActions = scoredActions.sort((a, b) => b.score - a.score);

        for (const action of sortedActions) {
            const { providerName, model } = action;
            const provider = this.providerConfig[providerName];
            const key = provider.keys[Math.floor(Math.random() * provider.keys.length)];

            try {
                const result = await provider.fetch.call(this, messages, key, model.name);

                if (result && result.trim().length > 0) {
                    this.logger.info(`[AIService] Berhasil dari: ${provider.name} (${model.name})`);
                    this.telemetry.logInteraction({ sessionId, prompt, response: result, provider: providerName, model: model.name });
                    await this.contextManager.addMessage(sessionId, 'user', prompt);
                    await this.contextManager.addMessage(sessionId, 'assistant', result);
                    const cost = model.costIndex * 10;
                    this.state.metabolic.budgetRemaining -= cost;
                    return result;
                }
            } catch (error) {
                this.logger.warn(`[AIService] Gagal pada: ${provider.name} > ${model.name}`);
                this._applyTrustDamage(providerName, error);
            }
        }
        
        const fallbackResponse = this._findJsonFallback(prompt);
        if (fallbackResponse) return fallbackResponse;

        throw new Error("Semua layanan AI gagal merespon setelah mencoba semua strategi.");
    }

    // ===================================================================================
    // METODE INTERNAL (Private Methods)
    // ===================================================================================

    _parseApiKeys(value) {
        if (!value) return [];
        if (Array.isArray(value)) return value.flatMap(item => item.split(',')).map(key => key.trim()).filter(Boolean);
        return String(value).split(',').map(key => key.trim()).filter(Boolean);
    }
    
    _updateMetabolicMode() {
        const budgetPercentage = (this.state.metabolic.budgetRemaining / this.state.metabolic.dailyBudget) * 100;
        let newMode = 'frugal';
        if (budgetPercentage > 70) newMode = 'performance';
        else if (budgetPercentage > 20) newMode = 'balanced';
        if (this.state.metabolic.mode !== newMode) {
            this.logger.info(`[Metabolisme] Mode berubah ke: ${newMode.toUpperCase()} (Sisa Anggaran: ${budgetPercentage.toFixed(1)}%)`);
            this.state.metabolic.mode = newMode;
        }
    }

    _calculateEconomicPenalty(model) {
        const cost = model.costIndex;
        switch (this.state.metabolic.mode) {
            case 'performance': return cost * 0.5;
            case 'balanced': return cost * 1.0;
            case 'frugal': return cost * 2.5;
            default: return cost;
        }
    }

    _applyTrustDamage(providerName, error) {
        let beta = this.immuneParams.beta.default;
        if (error && error.status) {
            if (error.status === 401 || error.status === 403) beta = this.immuneParams.beta.authError;
            else if (error.status === 429) beta = this.immuneParams.beta.ratelimit;
            else if (error.status >= 500) beta = this.immuneParams.beta.serverError;
        }
        const currentTrust = this.state.providers[providerName].trustScore;
        this.state.providers[providerName].trustScore = Math.max(0, currentTrust - beta * currentTrust);
        this.logger.warn(`[Imunologi] Kepercayaan pada ${providerName} turun ke ${this.state.providers[providerName].trustScore.toFixed(2)}`);
    }

    _regenerateTrust() {
        for (const providerName in this.state.providers) {
            const currentTrust = this.state.providers[providerName].trustScore;
            if (currentTrust < 1.0) {
                const newTrust = currentTrust + this.immuneParams.alpha * (1 - currentTrust);
                this.state.providers[providerName].trustScore = Math.min(1.0, newTrust);
            }
        }
    }

    _dailyReset() {
        if (Date.now() - this.state.lastDailyReset > 24 * 3600 * 1000) {
            this.logger.info("[Metabolisme] Melakukan reset anggaran harian.");
            this.state.metabolic.budgetRemaining = this.state.metabolic.dailyBudget;
            this.state.lastDailyReset = Date.now();
        }
    }
    
    _findJsonFallback(prompt) {
        this.logger.warn(`[AIService] Semua provider API gagal. Mencoba JSON Fallback...`);
        try {
            const fallbackPath = path.join(process.cwd(), 'db', 'fallback.json');
            if (!fs.existsSync(fallbackPath)) return null;
            const fallbackData = JSON.parse(fs.readFileSync(fallbackPath, 'utf-8'));
            const lowerCasePrompt = prompt.toLowerCase();
            for (const item of fallbackData.keywords) {
                for (const keyword of item.key) {
                    if (lowerCasePrompt.includes(keyword)) {
                        this.logger.info(`[AIService] JSON Fallback ditemukan untuk kata kunci: '${keyword}'`);
                        return `(Mode Offline) ${item.response}`;
                    }
                }
            }
        } catch (e) {
            this.logger.error(`[AIService] Gagal memuat atau memproses fallback.json:`, e);
        }
        return null;
    }

    async _healthMonitor() {
        this.logger.debug("[Health Monitor] Menjalankan siklus pemeliharaan diri...");
        this._regenerateTrust();
        this._dailyReset();

        for (const providerName in this.state.providers) {
            const provider = this.providerConfig[providerName];
            const providerState = this.state.providers[providerName];
            if (provider.keys.length > 0 && providerState.trustScore < this.immuneParams.recoveryPingThreshold) {
                this.logger.info(`[Health Monitor] Skor ${provider.name} rendah, mencoba ping aktif...`);
                try {
                    await provider.ping.call(this, provider.keys[0]);
                    providerState.trustScore += this.immuneParams.recoveryPingBoost;
                    this.logger.info(`[Health Monitor] Ping ke ${provider.name} berhasil! Kepercayaan pulih ke ${providerState.trustScore.toFixed(2)}.`);
                } catch (error) {
                    this.logger.warn(`[Health Monitor] Ping ke ${provider.name} masih gagal.`);
                }
            }
        }
    }
    
    _startHealthMonitor() {
        setInterval(this._healthMonitor.bind(this), 5 * 60 * 1000);
    }

    _getDefaultProviders(apiKeys = {}) {
        return {
            openai: { name: "OpenAI", fetch: this._fetchOpenAI, ping: this._pingOpenAI, keys: this._parseApiKeys(apiKeys.openai), models: [ { name: 'gpt-4o', utility: 100, costIndex: 100 }, { name: 'gpt-3.5-turbo', utility: 80, costIndex: 20 } ]},
            groq: { name: "Groq", fetch: this._fetchGroq, ping: this._pingGroq, keys: this._parseApiKeys(apiKeys.groq), models: [ { name: 'llama3-70b-8192', utility: 90, costIndex: 30 }, { name: 'llama3-8b-8192', utility: 70, costIndex: 5 } ]},
            gemini: { name: "Gemini", fetch: this._fetchGemini, ping: this._pingGemini, keys: this._parseApiKeys(apiKeys.gemini), models: [ { name: 'gemini-1.5-pro-latest', utility: 95, costIndex: 80 }, { name: 'gemini-1.5-flash-latest', utility: 75, costIndex: 10 } ]}
        };
    }
    
    // --- Implementasi Fetch & Ping ---
    async _fetchOpenAI(messages, apiKey, model) {
        const system_prompt = { role: 'system', content: 'Anda adalah asisten AI. Selalu balas dalam Bahasa Indonesia kecuali diminta sebaliknya. Fokus pada pesan terakhir dari pengguna, gunakan pesan sebelumnya hanya sebagai konteks.' };
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
            body: JSON.stringify({ model, messages: [system_prompt, ...messages] })
        });
        if (!response.ok) { const err = new Error(`OpenAI API request failed: ${response.statusText}`); err.status = response.status; throw err; }
        const data = await response.json();
        if (!data.choices?.[0]?.message?.content) throw new Error('OpenAI API returned an invalid response structure.');
        return data.choices[0].message.content;
    }

    async _fetchGroq(messages, apiKey, model) {
        const system_prompt = { role: 'system', content: 'Anda adalah asisten AI. Selalu balas dalam Bahasa Indonesia kecuali diminta sebaliknya. Fokus pada pesan terakhir dari pengguna, gunakan pesan sebelumnya sebagai konteks.' };
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
            body: JSON.stringify({ model, messages: [system_prompt, ...messages] })
        });
        if (!response.ok) { const err = new Error(`Groq API request failed: ${response.statusText}`); err.status = response.status; throw err; }
        const data = await response.json();
        if (!data.choices?.[0]?.message?.content) throw new Error('Groq API returned an invalid response structure.');
        return data.choices[0].message.content;
    }

    async _fetchGemini(messages, apiKey, model) {
        const system_instruction = { role: 'user', parts: [{ text: "Instruksi sistem: Mulai sekarang, selalu balas dalam Bahasa Indonesia. Fokus pada pesan terakhir dari pengguna, gunakan pesan sebelumnya sebagai konteks." }] };
        const model_response_for_instruction = { role: 'model', parts: [{ text: "Baik, saya mengerti." }] };
        const contents = messages.map(msg => ({ role: msg.role === 'assistant' ? 'model' : 'user', parts: [{ text: msg.content }] }));
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [system_instruction, model_response_for_instruction, ...contents] })
        });
        if (!response.ok) { const err = new Error(`Gemini API request failed: ${response.statusText}`); err.status = response.status; throw err; }
        const data = await response.json();
        if (!data.candidates?.[0]?.content?.parts?.[0]?.text) throw new Error('Gemini API returned an invalid response structure.');
        return data.candidates[0].content.parts[0].text;
    }

    async _pingOpenAI(apiKey) {
        const res = await fetch('https://api.openai.com/v1/models', { headers: { 'Authorization': `Bearer ${apiKey}` } });
        if (!res.ok) throw new Error(`Ping failed with status ${res.status}`);
        return true;
    }

    async _pingGroq(apiKey) {
        await this._fetchGroq([{role: 'user', content: 'hello'}], apiKey, "llama3-8b-8192");
        return true;
    }

    async _pingGemini(apiKey) {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        if (!res.ok) throw new Error(`Ping failed with status ${res.status}`);
        return true;
    }
}
