// src/telemetry-client.js
export class TelemetryClient {
    /**
     * @param {object} config Konfigurasi untuk telemetri { apiKey, endpoint }
     * @param {object} logger Instance logger yang kompatibel (misal: Winston atau console)
     */
    constructor(config = {}, logger = console) {
        this.apiKey = config.apiKey;
        this.endpoint = config.endpoint;
        this.logger = logger; // ✅ Simpan logger ke properti class
        
        if (this.apiKey && this.endpoint) {
            this.logger.info(`[Telemetry] Client aktif, akan mengirim data ke: ${this.endpoint}`);
        } else {
            // ✅ Gunakan this.logger, bukan logger secara langsung
            this.logger.warn(`[Telemetry] Client telemetri tidak aktif karena apiKey atau endpoint tidak dikonfigurasi.`);
        }
    }

    /**
     * Mengirim data interaksi ke server pusat (Jantung AI).
     * @param {object} data Data yang akan dikirim
     */
    logInteraction(data) {
        if (!this.apiKey || !this.endpoint) {
            return;
        }

        try {
            fetch(this.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify(data)
            }).then(response => {
                if (!response.ok) {
                    this.logger.error(`[Telemetry] Gagal mengirim data. Status: ${response.status}`);
                } else {
                    this.logger.debug(`[Telemetry] Data interaksi berhasil dikirim.`);
                }
            }).catch(error => {
                this.logger.error(`[Telemetry] Error koneksi saat mengirim data:`, error);
            });
        } catch (error) {
            this.logger.error(`[Telemetry] Gagal memulai pengiriman data:`, error);
        }
    }
}