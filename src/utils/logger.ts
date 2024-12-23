import winston from "winston"
import DailyRotateFile from "winston-daily-rotate-file";

const fileRotateTransport: DailyRotateFile = new DailyRotateFile({
    filename: "logs/%DATE%.log",
    datePattern: "YYYY-MM-DD",
    zippedArchive: true,
    maxSize: "20m",
    maxFiles: "30d",
    createSymlink: true,
});

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL,
    format: winston.format.combine(
        winston.format.errors({ stack: true }),
        winston.format.timestamp(),
        winston.format.json(),
    ),
    transports: [
        new winston.transports.Console(),
        fileRotateTransport,
    ],
    exceptionHandlers: [
        new winston.transports.File({ filename: "logs/exception.log" }),
    ],
    rejectionHandlers: [
        new winston.transports.File({ filename: "logs/rejections.log" }),
    ],
});

export { logger }
