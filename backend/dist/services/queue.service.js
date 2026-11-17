"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FEE_REMINDER_QUEUE_NAME = exports.redisConnectionOptions = void 0;
exports.getRedisConnection = getRedisConnection;
exports.getFeeReminderQueue = getFeeReminderQueue;
exports.initFeeReminderWorker = initFeeReminderWorker;
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
const env_1 = require("../config/env");
// Shared Redis connection configuration
exports.redisConnectionOptions = {
    host: env_1.ENV.REDIS_HOST,
    port: env_1.ENV.REDIS_PORT,
    password: env_1.ENV.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null, // Required by BullMQ
    enableReadyCheck: false,
    lazyConnect: true,
    retryStrategy: (times) => {
        // If Redis is not running locally, don't spam errors indefinitely
        if (times > 3) {
            return null;
        }
        return Math.min(times * 1000, 3000);
    },
};
let sharedConnection = null;
let isRedisAvailable = false;
function getRedisConnection() {
    if (!sharedConnection) {
        sharedConnection = new ioredis_1.default(exports.redisConnectionOptions);
        sharedConnection.on('connect', () => {
            isRedisAvailable = true;
            console.log('✅ BullMQ / Redis connection established');
        });
        sharedConnection.on('error', (err) => {
            isRedisAvailable = false;
            // Log quietly once if Redis is not running locally
            console.warn('⚠️ BullMQ Redis unavailable (falling back to graceful processing):', err.message);
        });
    }
    return sharedConnection;
}
exports.FEE_REMINDER_QUEUE_NAME = 'fee-reminder-queue';
let feeReminderQueueInstance = null;
function getFeeReminderQueue() {
    if (!feeReminderQueueInstance) {
        const connection = getRedisConnection();
        feeReminderQueueInstance = new bullmq_1.Queue(exports.FEE_REMINDER_QUEUE_NAME, {
            connection: connection,
            defaultJobOptions: {
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 5000,
                },
                removeOnComplete: true,
                removeOnFail: 1000,
            },
        });
    }
    return feeReminderQueueInstance;
}
/**
 * Initialize Worker to process reminders in background
 */
function initFeeReminderWorker() {
    const connection = getRedisConnection();
    const worker = new bullmq_1.Worker(exports.FEE_REMINDER_QUEUE_NAME, async (job) => {
        const data = job.data;
        console.log(`[FeeReminderWorker] Processing reminder for student ${data.studentName} (${data.studentId})`);
        console.log(`[FeeReminderWorker] -> Contact: ${data.parentContact} | Amount: ₹${data.pendingAmount}`);
        console.log(`[FeeReminderWorker] -> Message: "${data.message}"`);
        // Here real SMS/Email/WhatsApp notification provider (Twilio, Sendgrid, Gupshup, etc.) is called
        // Simulate dispatch delay
        await new Promise((resolve) => setTimeout(resolve, 200));
        return {
            status: 'DELIVERED',
            recipient: data.parentContact,
            sentAt: new Date().toISOString(),
        };
    }, {
        connection: connection,
        concurrency: 5,
    });
    worker.on('completed', (job) => {
        console.log(`[FeeReminderWorker] Job ${job.id} completed for ${job.data?.studentName}`);
    });
    worker.on('failed', (job, err) => {
        console.error(`[FeeReminderWorker] Job ${job?.id} failed:`, err.message);
    });
    return worker;
}
//# sourceMappingURL=queue.service.js.map