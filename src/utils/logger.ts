import winston from "winston"
import LokiTransport from "winston-loki";

const lokiTransport = new LokiTransport({
    host: process.env.LOKI_HOST || "",
    labels: { app: "portim", env: process.env.NODE_ENV || "not-defined" },
    json: true,
    basicAuth: `${process.env.LOKI_USER_ID}:${process.env.LOKI_TOKEN}`,
    format: winston.format.json(),
    replaceTimestamp: true,
    batching: true,
    interval: 5,
    onConnectionError: (err) => console.error(err),
})

const transports: winston.transport[] = [
    new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(({ timestamp, level, message, stack }) => {
                return stack
                    ? `[${timestamp}] ${level}: ${message}\nStack: ${stack}`
                    : `[${timestamp}] ${level}: ${message}`;
            }),
        ),
    }),
]

if (process.env.NODE_ENV && process.env.NODE_ENV !== "local") transports.push(lokiTransport)

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || "info",
    format: winston.format.combine(
        winston.format.errors({ stack: true }),
        winston.format.timestamp(),
        winston.format.json(),
    ),
    transports,
});

export { logger }
