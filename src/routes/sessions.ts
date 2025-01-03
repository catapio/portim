import z from "zod";
import { FastifyTypedInstance } from "../types";
import { Authorization } from "../middlewares/authorize";
import { SessionUseCases } from "../usecases/sessions";

const defaultSchema = {
    security: [
        {
            bearerAuth: [],
        },
    ],
    tags: ["Sessions"]
}

export async function sessionRoutes(app: FastifyTypedInstance, authorization: Authorization, sessionUseCases: SessionUseCases) {
    app.post("/projects/:projectId/interfaces/:interfaceId/sessions", {
        preHandler: authorization.authorize,
        schema: {
            ...defaultSchema,
            description: "Create session",
            params: z.object({
                projectId: z.string(),
                interfaceId: z.string(),
            }),
            body: z.object({
                clientId: z.string(),
                target: z.string().length(24).optional()
            }),
            response: {
                201: z.object({
                    id: z.string(),
                    source: z.string(),
                    target: z.string(),
                    clientId: z.string(),
                    createdAt: z.date(),
                    updatedAt: z.date(),
                }).describe("Created session"),
                401: z.object({
                    statusCode: z.number().default(401),
                    error: z.string(),
                    message: z.string()
                }).describe("Unauthorized"),
            }
        }
    }, async (request, reply) => {
        request.logger.info(`creating new session. interfaceId: ${request.params.interfaceId} with clientId: ${request.body.clientId}`)

        const newSession = await sessionUseCases.createSession(request.body, request.params.interfaceId)

        request.logger.info(`created new session. interfaceId: ${request.params.interfaceId}. id: ${newSession.id}`)
        return reply.status(201).send(newSession)
    })

    app.get("/projects/:projectId/interfaces/:interfaceId/sessions/:sessionId", {
        preHandler: authorization.authorize,
        schema: {
            ...defaultSchema,
            description: "Fetch a session",
            params: z.object({
                projectId: z.string(),
                interfaceId: z.string(),
                sessionId: z.string(),
            }),
            response: {
                200: z.object({
                    id: z.string(),
                    source: z.string(),
                    target: z.string(),
                    clientId: z.string(),
                    createdAt: z.date(),
                    updatedAt: z.date(),
                }).describe("Fetched session"),
                401: z.object({
                    statusCode: z.number().default(401),
                    error: z.string(),
                    message: z.string()
                }).describe("Unauthorized"),
            }
        }
    }, async (request, reply) => {
        const session = await sessionUseCases.getSession(request.params)

        return reply.status(200).send(session)
    })

    app.post("/projects/:projectId/interfaces/:interfaceId/sessions/:sessionId/passControl", {
        preHandler: authorization.authorize,
        schema: {
            ...defaultSchema,
            description: "Update a session with new target",
            params: z.object({
                projectId: z.string(),
                interfaceId: z.string(),
                sessionId: z.string(),
            }),
            body: z.object({
                target: z.string().length(24),
                metadata: z.record(z.unknown()).optional()
            }),
            response: {
                200: z.object({
                    id: z.string(),
                    source: z.string(),
                    target: z.string(),
                    clientId: z.string(),
                    createdAt: z.date(),
                    updatedAt: z.date(),
                }).describe("Updated target of session"),
                401: z.object({
                    statusCode: z.number().default(401),
                    error: z.string(),
                    message: z.string()
                }).describe("Unauthorized"),
                403: z.object({
                    statusCode: z.number().default(403),
                    error: z.string(),
                    message: z.string()
                }).describe("Forbidden"),
            }
        }
    }, async (request, reply) => {
        const updatedSession = await sessionUseCases.updateSession({
            ...request.body,
            sessionId: request.params.sessionId
        })

        return reply.status(200).send(updatedSession)
    })

    app.delete("/projects/:projectId/interfaces/:interfaceId/sessions/:sessionId", {
        preHandler: authorization.authorize,
        schema: {
            ...defaultSchema,
            description: "Delete a session",
            params: z.object({
                projectId: z.string(),
                interfaceId: z.string(),
                sessionId: z.string(),
            }),
            response: {
                204: z.void().describe("Deleted session"),
                401: z.object({
                    statusCode: z.number().default(401),
                    error: z.string(),
                    message: z.string()
                }).describe("Unauthorized"),
                403: z.object({
                    statusCode: z.number().default(403),
                    error: z.string(),
                    message: z.string()
                }).describe("Forbidden"),
            }
        }
    }, async (request, reply) => {
        await sessionUseCases.deleteSession(request.params)

        return reply.status(204).send()
    })
}
