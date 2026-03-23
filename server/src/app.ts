import cors from "cors";
import express from "express";
import helmet from "helmet";

import { errorMiddleware } from "./middleware/error.middleware.js";
import { requestLoggerMiddleware } from "./middleware/requestLogger.middleware.js";
import { authRouter } from "./routes/auth.routes.js";
import { changeOrderRouter } from "./routes/changeOrder.routes.js";
import { integrationRouter } from "./routes/integration.routes.js";
import { projectRouter } from "./routes/project.routes.js";
import { webhookRouter } from "./routes/webhook.routes.js";

export const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(requestLoggerMiddleware);

app.get("/health", (_request, response) => {
  response.json({
    success: true,
    data: { status: "ok" }
  });
});

app.use("/api/auth", authRouter);
app.use("/api/projects", projectRouter);
app.use("/api/change-orders", changeOrderRouter);
app.use("/api/integrations", integrationRouter);
app.use("/api/webhooks", webhookRouter);

app.use(errorMiddleware);

