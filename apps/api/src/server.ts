import { createApp } from "./app.js";
import { connectDatabase, disconnectDatabase } from "./config/database.js";
import { env } from "./config/env.js";

async function bootstrap() {
  await connectDatabase();
  const app = createApp();
  const server = app.listen(env.PORT, () => {
    console.info(`OriginGrid API listening on port ${env.PORT}`);
  });

  const shutdown = (signal: string) => {
    console.info(`${signal} received; shutting down gracefully`);
    server.close(() => {
      void disconnectDatabase().finally(() => process.exit(0));
    });
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

bootstrap().catch((error: unknown) => {
  console.error("API startup failed", error);
  process.exit(1);
});
