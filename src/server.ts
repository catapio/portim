import { fastify } from "fastify"
import { fastifyCors } from "@fastify/cors"
import { validatorCompiler, serializerCompiler, ZodTypeProvider, jsonSchemaTransform } from "fastify-type-provider-zod"
import { fastifySwagger } from "@fastify/swagger"
import { fastifySwaggerUi } from "@fastify/swagger-ui"
import path from "node:path"
import fs from "node:fs"
import { logger } from "./utils/logger"
import { randomUUID } from "node:crypto"
import { routes } from "./routes"

const app = fastify().withTypeProvider<ZodTypeProvider>()

// setup zod
app.setValidatorCompiler(validatorCompiler)
app.setSerializerCompiler(serializerCompiler)

// middleware to add id in request
app.addHook("onRequest", async (request) => {
    let reqId = request.headers["x-request-id"] as string | undefined;

    if (!reqId) {
        reqId = randomUUID();
    }

    request.id = reqId;

    const childLogger = logger.child({ requestId: request.id });
    request.logger = childLogger;
});

// middleware to log response track
app.addHook("onResponse", async (request, reply) => {
    logger.info("http-response", {
        requestId: request.id,
        method: request.method,
        url: request.url,
        status: reply.statusCode,
        ip: request.ip,
        responseTime: reply.elapsedTime,
        contentLength: reply.getHeader("content-length"),
    });
});

// cors
app.register(fastifyCors, { origin: "*" })

// swagger config
app.register(fastifySwagger, {
    openapi: {
        info: {
            title: "Portim API",
            version: "1.0.0",
        }
    },
    transform: jsonSchemaTransform,
})

app.register(fastifySwaggerUi, {
    routePrefix: "/docs",
    logo: {
        type: "image/png",
        content: fs.readFileSync(path.resolve(__dirname, "../public", "logo.png"))
    },
    theme: {
        favicon: [
            {
                filename: "favicon.png",
                rel: "icon",
                sizes: "32x32",
                type: "image/png",
                content: fs.readFileSync(path.resolve(__dirname, "../public", "favicon.png"))
            }
        ]
    }
})

app.register(routes)

// start
if (!process.env.PORT) logger.warn("PORT not defined. setting 3000")
app.listen({ port: Number(process.env.PORT) || 3000 }).then(() => {
    logger.info(`application started on port: ${process.env.PORT}`)
})

// graceful shutdown
const shutdown = async () => {
    try {
        logger.info("shutting down gracefully...");
        await app.close();
        logger.info("server closed successfully.");
        process.exit(0);
    } catch (error) {
        logger.error("error during shutdown:", error);
        process.exit(0);
    }
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
