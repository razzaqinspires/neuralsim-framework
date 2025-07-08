// src/index.js
import { AIService } from './AIService.js';
import { BaseStorageAdapter } from './storage/BaseStorageAdapter.js';
import { JsonStorageAdapter } from './storage/JsonStorageAdapter.js';
import { WorkloadTracker } from './WorkloadTracker.js'; // ✅ Tambahkan ini

// Ekspor semua komponen utama agar pengguna framework bisa menggunakannya
export { AIService, BaseStorageAdapter, JsonStorageAdapter, WorkloadTracker };