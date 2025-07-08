import { AIService, JsonStorageAdapter } from 'neuralsim-framework';
import 'dotenv/config'; // Gunakan 'dotenv' untuk memuat environment variables

// --- INI ADALAH SIMULASI BAGAIMANA BOT ANDA AKAN MENGGUNAKAN FRAMEWORK ---

console.log("=============================================");
console.log("||   Memulai Simulasi Bot dengan           ||");
console.log("||   NEURALSIM-FRAMEWORK                   ||");
console.log("=============================================");

// 1. Bot memuat konfigurasi sensitif dari environment variables (praktik terbaik)
//    Anda perlu membuat file '.env' di root proyek ini.
const botConfig = {
    // Kunci API untuk service AI (diambil dari .env)
    API_KEYS: {
        openai: process.env.OPENAI_API_KEYS,
        groq: process.env.GROQ_API_KEYS,
        gemini: process.env.GEMINI_API_KEYS,
    },
    // Kunci API untuk mengirim data ke Jantung AI Anda (diambil dari .env)
    TELEMETRY_CONFIG: {
        apiKey: process.env.TELEMETRY_API_KEY,
        endpoint: process.env.TELEMETRY_ENDPOINT,
    },
};

// 2. Bot mengonfigurasi dan membuat instance AIService
const aiService = new AIService({
    apiKeys: botConfig.API_KEYS,
    telemetry: botConfig.TELEMETRY_CONFIG,
    
    // Pengguna framework memilih adapter penyimpanan mereka.
    // Di sini kita memilih penyimpanan JSON lokal yang sederhana.
    storageAdapter: new JsonStorageAdapter({ 
        path: './bot_database', // Tentukan di mana file memori akan disimpan
        logger: console 
    }),

    // Opsi untuk menyuntikkan logger kustom, jika tidak, defaultnya adalah 'console'
    logger: console 
});

// 3. Bot menggunakan service tersebut di dalam logikanya
async function handleWhatsAppMessage(userJid, prompt) {
    console.log(`\n[Bot] Menerima pesan dari [${userJid}]: "${prompt}"`);
    try {
        const response = await aiService.chat(userJid, prompt);
        console.log(`[AI] Respons untuk [${userJid}]: "${response}"`);
        // Di bot nyata, baris di bawah ini akan mengirim 'response' ke pengguna WhatsApp
        // await sock.sendMessage(userJid, { text: response });
    } catch (error) {
        console.error(`[Bot] Gagal total mendapatkan respons AI untuk [${userJid}]:`, error.message);
        // Di bot nyata, baris ini akan mengirim pesan error ke pengguna
        // await sock.sendMessage(userJid, { text: `Maaf, terjadi error: ${error.message}` });
    }
}

// --- Simulasi Penggunaan ---
async function runSimulation() {
    console.log("\n--- Memulai Sesi Simulasi ---");
    
    // Pengguna 1 memulai percakapan
    await handleWhatsAppMessage("user-123", "Halo, perkenalkan dirimu.");
    
    // Pengguna 1 melanjutkan percakapan
    await handleWhatsAppMessage("user-123", "Apa fungsi utama dari arsitektur neuro-imunologis?");

    // Pengguna 2 memulai percakapan baru
    await handleWhatsAppMessage("user-456", "Sebutkan 3 planet di tata surya.");
    
    // Pengguna 1 kembali bertanya, AI harus ingat konteks sebelumnya
    await handleWhatsAppMessage("user-123", "Jelaskan lebih lanjut tentang parameter beta dalam sistem tersebut.");

    console.log("\n--- Sesi Simulasi Selesai ---");
}

runSimulation();