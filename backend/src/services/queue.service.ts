import { Queue, Worker, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';
import { ENV } from '../config/env';

// Shared Redis connection configuration
export const redisConnectionOptions = {
  host: ENV.REDIS_HOST,
  port: ENV.REDIS_PORT,
  password: ENV.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null, // Required by BullMQ
  enableReadyCheck: false,
  lazyConnect: true,
  retryStrategy: (times: number) => {
    // If Redis is not running locally, don't spam errors indefinitely
    if (times > 3) {
      return null;
    }
    return Math.min(times * 1000, 3000);
  },
};

let sharedConnection: IORedis | null = null;
let isRedisAvailable = false;

export function getRedisConnection(): IORedis {
  if (!sharedConnection) {
    sharedConnection = new IORedis(redisConnectionOptions);

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

export const FEE_REMINDER_QUEUE_NAME = 'fee-reminder-queue';

export interface FeeReminderJobPayload {
  actionId: string;
  tenantId: string;
  userId: string;
  studentId: string;
  studentName: string;
  className: string;
  parentName: string;
  parentContact: string;
  parentEmail?: string;
  pendingAmount: number;
  invoiceNumber?: string;
  dueDate?: string;
  message: string;
}

let feeReminderQueueInstance: Queue | null = null;

export function getFeeReminderQueue(): Queue {
  if (!feeReminderQueueInstance) {
    const connection = getRedisConnection();
    feeReminderQueueInstance = new Queue(FEE_REMINDER_QUEUE_NAME, {
      connection: connection as any,
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
export function initFeeReminderWorker() {
  const connection = getRedisConnection();

  const worker = new Worker(
    FEE_REMINDER_QUEUE_NAME,
    async (job) => {
      const data = job.data as FeeReminderJobPayload;
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
    },
    {
      connection: connection as any,
      concurrency: 5,
    }
  );

  worker.on('completed', (job) => {
    console.log(`[FeeReminderWorker] Job ${job.id} completed for ${job.data?.studentName}`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[FeeReminderWorker] Job ${job?.id} failed:`, err.message);
  });

  return worker;
}
