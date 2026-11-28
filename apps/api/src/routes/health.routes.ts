import { Router } from "express";
import mongoose from "mongoose";

export const healthRouter = Router();

healthRouter.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: "ok",
      service: "origingrid-api",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime())
    }
  });
});

healthRouter.get("/ready", (_req, res) => {
  const databaseReady = mongoose.connection.readyState === 1;
  res.status(databaseReady ? 200 : 503).json({
    success: databaseReady,
    data: { status: databaseReady ? "ready" : "not-ready", dependencies: { mongodb: databaseReady ? "connected" : "disconnected" } }
  });
});
