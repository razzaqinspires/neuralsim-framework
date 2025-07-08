import fs from 'fs';
import path from 'path';
import { BaseStorageAdapter } from './BaseStorageAdapter.js';

export class JsonStorageAdapter extends BaseStorageAdapter {
    constructor(options = {}) {
        super(options);
        const dbPath = options.path || path.join(process.cwd(), 'db');
        if (!fs.existsSync(dbPath)) fs.mkdirSync(dbPath, { recursive: true });
        this.filePath = path.join(dbPath, 'conversation_memory.json');
        this.MAX_HISTORY = options.maxHistory || 20;

        if (!fs.existsSync(this.filePath)) {
            fs.writeFileSync(this.filePath, JSON.stringify({}));
            this.logger.info(`[JsonStorage] File memori berhasil dibuat di ${this.filePath}`);
        }
    }

    _readMemory() {
        try {
            return JSON.parse(fs.readFileSync(this.filePath, 'utf-8'));
        } catch (error) {
            this.logger.error("[JsonStorage] Gagal membaca file memori:", error);
            return {};
        }
    }

    _writeMemory(data) {
        try {
            fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
        } catch (error) {
            this.logger.error("[JsonStorage] Gagal menulis ke file memori:", error);
        }
    }

    async addMessage(sessionId, role, content) {
        const memory = this._readMemory();
        if (!memory[sessionId]) memory[sessionId] = [];
        memory[sessionId].push({ role, content, timestamp: Date.now() });
        while (memory[sessionId].length > this.MAX_HISTORY) {
            memory[sessionId].shift();
        }
        this._writeMemory(memory);
    }

    async getHistory(sessionId, limit = 10) {
        const memory = this._readMemory();
        const userHistory = memory[sessionId] || [];
        return userHistory.slice(-limit).map(msg => ({ role: msg.role, content: msg.content }));
    }
}