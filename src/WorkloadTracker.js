// src/WorkloadTracker.js

// Kita tidak butuh logger di sini karena ini adalah class statis murni
// Logger akan diteruskan oleh pemanggil jika diperlukan.

export class WorkloadTracker {
    /**
     * Menghitung "biaya energi" dari sebuah interaksi AI.
     * @param {string} prompt Teks pertanyaan dari pengguna.
     * @param {string} response Teks jawaban dari AI.
     * @returns {number} Biaya energi yang dihitung.
     */
    static calculateCost(prompt, response) {
        const promptWeight = 0.01;
        const responseWeight = 0.02;
        const baseCost = 0.5;

        const promptLength = prompt?.length || 0;
        const responseLength = response?.length || 0;

        let cost = baseCost + (promptLength * promptWeight) + (responseLength * responseWeight);

        if (response.includes('```')) {
            cost *= 1.5;
        }

        return Math.min(cost, 25);
    }
}