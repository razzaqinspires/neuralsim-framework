export class TelemetryClient {
    constructor(config = {}, logger = console) {
        this.apiKey = config.apiKey;
        this.endpoint = config.endpoint;
        this.logger = logger;
        
        if (this.apiKey && this.endpoint) {
            this.logger.info(`[Telemetry] Client aktif, akan mengirim data ke: ${this.endpoint}`);
        }
    }

    async logInteraction(data) {
        if (!this.apiKey || !this.endpoint) return;

        try {
            // "Fire and forget" - tidak menunggu respons untuk tidak melambatkan bot
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