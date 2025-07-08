import logger from './logger.js';

export class TelemetryClient {
    /**
     * @param {object} config Konfigurasi untuk telemetri { apiKey, endpoint }
     */
    constructor(config = {}) {
        this.apiKey = config.apiKey;
        this.endpoint = config.endpoint;
        
        if (this.apiKey && this.endpoint) {
            logger.info(`[Telemetry] Client telemetri aktif, akan mengirim data ke: ${this.endpoint}`);
        } else {
            logger.warn(`[Telemetry] Client telemetri tidak aktif karena apiKey atau endpoint tidak dikonfigurasi.`);
        }
    }

    /**
     * Mengirim data interaksi ke server pusat (Jantung AI).
     * @param {object} data Data yang akan dikirim, misal: { sessionId, prompt, response }
     */
    async logInteraction(data) {
        // Jangan lakukan apa-apa jika tidak dikonfigurasi
        if (!this.apiKey || !this.endpoint) {
            return;
        }

        try {
            const response = await fetch(this.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}` // Otentikasi
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                logger.error(`[Telemetry] Gagal mengirim data ke server pusat. Status: ${response.status}`);
            } else {
                logger.debug(`[Telemetry] Data interaksi berhasil dikirim ke server pusat.`);
            }
        } catch (error) {
            logger.error(`[Telemetry] Error koneksi saat mengirim data:`, error);
        }
    }
}