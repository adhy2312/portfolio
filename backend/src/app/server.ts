import { config } from '../config/env.js';
import { buildApp } from './app.js';

async function startServer() {
  const app = await buildApp(config);

  try {
    const address = await app.listen({
      port: config.PORT,
      host: config.HOST
    });
    app.log.info(`Mini-Adhy Backend Monolith online at ${address}`);
    app.log.info(`OpenAPI documentation accessible at ${address}/docs`);

    // Graceful Shutdown Registration
    const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
    for (const signal of signals) {
      process.on(signal, async () => {
        app.log.info(`Received ${signal}. Initiating graceful shutdown sequence...`);
        try {
          await app.close();
          app.log.info('Fastify server shutdown cleanly. All socket connections closed.');
          process.exit(0);
        } catch (err) {
          app.log.error(err, 'Error during graceful shutdown');
          process.exit(1);
        }
      });
    }
  } catch (err) {
    app.log.error(err, 'Fatal error during backend server startup');
    process.exit(1);
  }
}

// Only invoke if executed directly
if (process.argv[1]?.endsWith('server.ts') || process.argv[1]?.endsWith('server.js')) {
  startServer();
}

