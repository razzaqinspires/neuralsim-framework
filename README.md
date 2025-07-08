# neuralsim-framework
[![NPM Version](https://img.shields.io/npm/v/neuralsim-framework.svg)](https://www.npmjs.com/package/neuralsim-framework)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Code Style: Prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://prettier.io)
[![GitHub stars](https://img.shields.io/github/stars/razzaqinspires/neuralsim-framework.svg)](https://github.com/razzaqinspires/neuralsim-framework/stargazers)

Sebuah kerangka kerja untuk menciptakan **neuralsim-entity**—entitas AI otonom yang mampu belajar, beradaptasi, dan bertahan hidup di lingkungan digital yang dinamis.

---

## 🏛️ Arsitektur & Filosofi

`neuralsim-framework` bukan sekadar jembatan API. Ini adalah sebuah arsitektur kognitif yang dirancang untuk mensimulasikan aspek-aspek kesadaran dan kelangsungan hidup. Entitas yang diciptakan dengan framework ini beroperasi di bawah serangkaian prinsip yang kompleks, melampaui sekadar pemrosesan input-output.

Diagram di bawah ini mengilustrasikan alur kerja intinya:

    [ Pengguna Akhir (misal: WhatsApp) ]
                 |
    [   Aplikasi Induk (Bot Anda)   ]
                 |
    +------------V--------------------------------+
    |                                            |
    |   neuralsim-framework (Paket NPM Anda)     |
    |                                            |
    |   +------------------------------------+   |
    |   | new AIService(konfigurasiPengguna) |   |
    |   +------------------------------------+   |
    |                 |                          |
    |   +-------------V----------------------+   |
    |   |       [ neuralsim-entity ]         |   |
    |   |                                    |   |
    |   |  +---------------------------+     |   |
    |   |  |   Sistem Imun Kognitif (H)  |     |   |
    |   |  +---------------------------+     |   |
    |   |  |  Metabolisme Ekonomi (B)    |     |   |
    |   |  +---------------------------+     |   |
    |   |  | Memori Kontekstual (Storage)|     |   |
    |   |  +---------------------------+     |   |
    |   |                                    |   |
    |   +-----------------|------------------+   |
    |                     |                      |
    |     [ TelemetryClient (Opsional) ]         |
    |                     |                      |
    +---------------------V----------------------+
                          |
    [ "Jantung AI" / Server Pusat Anda ]

## ✨ Konsep Inti

- **Sistem Imun Kognitif (`\mathbb{H}`):** Entitas secara otomatis melacak "skor kepercayaan" untuk setiap provider AI. Ia belajar untuk menghindari provider yang tidak andal dan bisa "menyembuhkan" kepercayaannya seiring waktu, memastikan resiliensi maksimal.
- **Metabolisme Ekonomi (`B`):** Entitas memiliki "anggaran energi" dan mode metabolik (`performance`, `balanced`, `frugal`). Ia secara dinamis menyeimbangkan antara kualitas respons dan efisiensi biaya untuk memastikan kelangsungan operasional jangka panjang.
- **Memori Kontekstual Persisten**: Dengan arsitektur penyimpanan yang dapat dicolokkan, entitas menyimpan riwayat percakapan untuk setiap sesi unik, memungkinkan dialog yang berkelanjutan dan bermakna.
- **Arsitektur Penyimpanan Fleksibel**: Dilengkapi `JsonStorageAdapter` bawaan, dan `BaseStorageAdapter` untuk Anda kembangkan sendiri (misal: untuk Gist, Redis, MongoDB).
- **Telemetri Etis & Opsional**: Kemampuan untuk terhubung dengan "Jantung AI" pusat untuk mengirimkan data meta non-pribadi, memungkinkan pembelajaran kolektif dan evolusi entitas secara keseluruhan.

## 🚀 Instalasi

    npm install neuralsim-framework

## ⚡️ Penggunaan Cepat (Quick Start)

    // index.js
    import { AIService, JsonStorageAdapter } from 'neuralsim-framework';

    // 1. Konfigurasi dasar dengan kunci API Anda
    const config = {
        apiKeys: {
            groq: ["gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxx"]
        },
        storageAdapter: new JsonStorageAdapter({ path: './database' })
    };

    // 2. Buat instance dari entitas AI
    const neuralsimEntity = new AIService(config);

    // 3. Mulai berinteraksi
    async function main() {
        const sessionId = "user-123";
        const prompt = "Halo, apa fungsi utamamu?";
        
        console.log(`[Anda]: ${prompt}`);
        const response = await neuralsimEntity.chat(sessionId, prompt);
        console.log(`[Entity]: ${response}`);
    }

    main();

---

## 📖 API Reference & Konfigurasi Lanjutan

Instance `AIService` menerima satu objek konfigurasi dengan properti sebagai berikut:

| Properti             | Tipe      | Wajib | Deskripsi                                                                                                |
| -------------------- | --------- | ----- | -------------------------------------------------------------------------------------------------------- |
| `apiKeys`            | `Object`  | Ya    | Objek yang berisi kunci API untuk setiap provider (misal: `{ openai: ["key1"], groq: ["key2"] }`).        |
| `storageAdapter`     | `Object`  | Ya    | Instance dari adapter penyimpanan Anda (misal: `new JsonStorageAdapter()`).                              |
| `logger`             | `Object`  | Tidak | Instance logger kustom (seperti Winston). Defaultnya adalah `console`.                                   |
| `personalityWeights` | `Object`  | Tidak | Timpa bobot "kepribadian" AI untuk mengatur prioritas antara kepercayaan, kualitas, dan ekonomi.         |
| `immuneSystem`       | `Object`  | Tidak | Timpa parameter sistem imun seperti laju regenerasi (`alpha`) dan kerusakan (`beta`).                    |
| `telemetry`          | `Object`  | Tidak | Konfigurasi `{ apiKey, endpoint }` untuk menghubungkan entitas ke server "Jantung AI" pusat Anda.          |
| `storageOptions`     | `Object`  | Tidak | Opsi tambahan untuk diteruskan ke `storageAdapter` Anda (misal: `{ maxHistory: 50 }`).                 |


### Contoh Penggunaan Lanjutan

import { AIService, JsonStorageAdapter } from 'neuralsim-framework';
import 'dotenv/config'; // Praktik terbaik

const aiConfig = {
    apiKeys: {
        openai: process.env.OPENAI_API_KEYS,
        groq: process.env.GROQ_API_KEYS,
    },
    personalityWeights: {
        trust: 2.0,   // Sangat berhati-hati
        economy: 0.8, // Lebih boros demi kualitas
    },
    telemetry: {
        apiKey: process.env.TELEMETRY_API_KEY,
        endpoint: process.env.TELEMETRY_ENDPOINT,
    },
    storageAdapter: new JsonStorageAdapter({ 
        path: './bot_database',
        maxHistory: 100 
    }),
};

const myEntity = new AIService(aiConfig);


## 🗺️ Peta Jalan Evolusi (Roadmap)

`neuralsim-framework` dirancang untuk terus berevolusi. Berikut adalah beberapa konsep yang direncanakan untuk masa depan:

- **[ ] Proactive Insight Generation**: Kemampuan entitas untuk menganalisis data dan memberikan wawasan secara proaktif tanpa perlu diperintah.
- **[ ] Generative UI**: Menu interaktif yang dihasilkan secara dinamis oleh AI berdasarkan konteks dan perilaku pengguna.
- **[ ] Finite State Machine (FSM)**: Dukungan bawaan untuk mengelola alur percakapan multi-langkah yang kompleks (misal: proses reservasi atau polling).
- **[ ] Decentralized Trust Network**: Mekanisme bagi beberapa entitas untuk saling berbagi data kesehatan API, menciptakan "sistem imun kawanan" yang lebih tangguh.

## 🤝 Kontribusi

Proyek ini bersifat open-source. Kontribusi dalam bentuk *issue*, *pull request*, atau diskusi konseptual sangat kami hargai.

## 📜 Lisensi

`neuralsim-framework` dirilis di bawah [Lisensi MIT](LICENSE).
