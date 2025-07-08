export class BaseStorageAdapter {
    constructor(options = {}) {
        this.logger = options.logger || console;
    }
    async addMessage(sessionId, role, content) {
        throw new Error("Metode 'addMessage' belum diimplementasikan.");
    }
    async getHistory(sessionId, limit = 10) {
        throw new Error("Metode 'getHistory' belum diimplementasikan.");
    }
}