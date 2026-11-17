"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const env_1 = require("./config/env");
const prisma_1 = require("./config/prisma");
const queue_service_1 = require("./services/queue.service");
const roleProvisioning_service_1 = require("./services/roleProvisioning.service");
const startServer = async () => {
    try {
        await prisma_1.prisma.$connect();
        console.log('✅ Connected to Database');
        // Run safe role backfill to ensure all tenants have complete default roles & permissions
        roleProvisioning_service_1.RoleProvisioningService.backfillAllSchools().catch((err) => console.warn('⚠️ Role backfill note:', err.message));
    }
    catch (error) {
        console.warn('⚠️ Warning: Database connection not established yet:', error.message);
    }
    // Initialize BullMQ background workers if available
    try {
        (0, queue_service_1.initFeeReminderWorker)();
    }
    catch (err) {
        console.warn('⚠️ BullMQ worker warning:', err.message);
    }
    const server = app_1.default.listen(env_1.ENV.PORT, () => {
        console.log(`🚀 School ERP API Server running on http://localhost:${env_1.ENV.PORT}`);
        console.log(`📡 Environment: ${env_1.ENV.NODE_ENV}`);
        console.log(`🌐 CORS enabled for: ${env_1.ENV.CLIENT_URL}`);
    });
    const gracefulShutdown = async () => {
        console.log('\n🛑 Shutting down gracefully...');
        server.close(async () => {
            await prisma_1.prisma.$disconnect();
            console.log('Database connections closed.');
            process.exit(0);
        });
    };
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
};
startServer();
//# sourceMappingURL=server.js.map