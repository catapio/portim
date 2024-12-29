import { fastify, RouteOptions } from "fastify"
import { fastifyCors } from "@fastify/cors"
import { validatorCompiler, serializerCompiler, ZodTypeProvider, jsonSchemaTransform } from "fastify-type-provider-zod"
import { fastifySwagger } from "@fastify/swagger"
import { fastifySwaggerUi } from "@fastify/swagger-ui"
import path from "node:path"
import fs from "node:fs"
import { logger } from "./utils/logger"
import { randomUUID } from "node:crypto"
import { userRoutes } from "./routes/users"
import { Supabase } from "./providers/auth/supabase"
import { UserService } from "./services/users"
import { authRoutes } from "./routes/auth"
import z from "zod"
import { projectRoutes } from "./routes/projects"
import { Authorization } from "./middlewares/authorize"
import fastifyFormbody from "@fastify/formbody"
import { ProjectService } from "./services/projects"
import { PrismaClient } from "@prisma/client"
import { UserUseCases } from "./usecases/users"
import { ProjectUseCases } from "./usecases/projects"

const app = fastify().withTypeProvider<ZodTypeProvider>()

const defaultSchema = {
    response: {
        400: z.object({
            statusCode: z.number().default(400),
            error: z.string(),
            message: z.string()
        }).describe("Expected error"),
        500: z.object({
            statusCode: z.number().default(500),
            error: z.string(),
            message: z.string()
        }).describe("Unexpected error"),
    },
};

// setup zod
app.setValidatorCompiler(validatorCompiler)
app.setSerializerCompiler(serializerCompiler)

app.addHook('onRoute', (routeOptions: RouteOptions) => {
    routeOptions.schema = {
        ...defaultSchema,
        ...routeOptions.schema,
        response: {
            ...defaultSchema.response,
            ...routeOptions.schema?.response as Record<number, unknown>,
        },
    };
});

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
        userId: request.user?.id,
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

// form body
app.register(fastifyFormbody)

// swagger config
app.register(fastifySwagger, {
    openapi: {
        info: {
            title: "Portim API",
            version: "1.0.0",
        },
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                    description: "Use format: Bearer {your_token}",
                },
            }
        },
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

// create dependencies
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
    logger.error("not found variables of supabase")
    process.exit(1)
}
const auth = new Supabase(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)
const authorization = new Authorization(auth)
const prisma = new PrismaClient()

// create services
const userService = new UserService(auth)
const projectService = new ProjectService(prisma)

// create use cases
const userUseCases = new UserUseCases(userService)
const projectUseCases = new ProjectUseCases(userService, projectService)

authRoutes(app)
app.register((app) => userRoutes(app, userUseCases))
app.register((app) => projectRoutes(app, authorization, projectUseCases))

app.setErrorHandler((error, request, reply) => {
    if (!error.statusCode || error.statusCode === 500) {
        const errorResponse = {
            statusCode: 500,
            error: "Internal Server Error",
            message: `An unexpected error occurred. Please try again later. id: ${request.id}`,
        };
        logger.error(error);
        reply.status(500).send(errorResponse);
    } else {
        reply.status(error.statusCode).send({
            statusCode: error.statusCode,
            error: error.name === "Error" ? "Bad Request" : error.name || "Bad Request",
            message: error.message,
        });
    }
});

// start
if (!process.env.PORT) logger.warn("PORT not defined. setting 3000")
app.listen({ port: Number(process.env.PORT) || 3000, host: process.env.FASTIFY_ADDRESS }).then(() => {
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
