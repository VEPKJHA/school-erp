import app from './app';
import { ENV } from './config/env';
import { prisma } from './config/prisma';

const startServer = async () => {
  try {
    await prisma.$connect();
    console.log('✅ Connected to Database');
  } catch (error: any) {
    console.warn('⚠️ Warning: Database connection not established yet:', error.message);
  }

  const server = app.listen(ENV.PORT, () => {
    console.log(`🚀 School ERP API Server running on http://localhost:${ENV.PORT}`);
    console.log(`📡 Environment: ${ENV.NODE_ENV}`);
    console.log(`🌐 CORS enabled for: ${ENV.CLIENT_URL}`);
  });

  const gracefulShutdown = async () => {
    console.log('\n🛑 Shutting down gracefully...');
    server.close(async () => {
      await prisma.$disconnect();
      console.log('Database connections closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);
};

startServer();
