import z from "zod";
import { FastifyTypedInstance } from "../types";
import { Authorization } from "../middlewares/authorize";
import { MessageUseCases } from "../usecases/messages";

const defaultSchema = {
    tags: ["Messages"]
}

export async function messageRoutes(app: FastifyTypedInstance, authorization: Authorization, messageUseCases: MessageUseCases) {
    app.post("/projects/:projectId/interfaces/:interfaceId/messages", {
        preHandler: authorization.authorize,
        schema: {
            ...defaultSchema,
            description: "Create message for systems that could not create session previously, the systems that is responsible to start the conversation.\n\nPortim will create new session if is the first message or it will retrieve the session created in database.\n\nThe identification of session comes from externalId configured in interface and the message will be sent to the control interface event endpoint. The sessionId will be added in header `catapio-session-id`",
            params: z.object({
                projectId: z.string(),
                interfaceId: z.string(),
            }),
            body: z.record(z.unknown()),
            response: {
                201: z.object({
                    id: z.string(),
                    sessionId: z.string(),
                    sender: z.string(),
                    content: z.string(),
                    status: z.string(),
                    createdAt: z.date(),
                    updatedAt: z.date(),
                }).describe("Created message"),
                401: z.object({
                    statusCode: z.number().default(401),
                    error: z.string(),
                    message: z.string()
                }).describe("Unauthorized"),
            }
        }
    }, async (request, reply) => {
        request.logger.info(`creating new message. interfaceId: ${request.params.interfaceId}`)

        const newMessage = await messageUseCases.createMessage(
            {
                body: request.body,
                headers: request.headers,
                sender: request.params.interfaceId,
                status: "pending"
            },
            request.params.projectId,
            request.params.interfaceId
        )

        request.logger.info(`created new message. interfaceId: ${request.params.interfaceId}. id: ${newMessage.id}`)
        return reply.status(201).send(newMessage)
    })

    app.post("/projects/:projectId/interfaces/:interfaceId/sessions/:sessionId/messages", {
        preHandler: authorization.authorize,
        schema: {
            ...defaultSchema,
            security: [
                {
                    bearerAuth: [],
                },
                {
                    basicAuth: [],
                }
            ],
            description: "Create message for already created sessions and has the sessionId.\n\n The interfaces that has no control interface must use this endpoint to send a new message.\n\nThe sessionId comes in header `catapio-session-id` of the incoming message",
            params: z.object({
                projectId: z.string(),
                interfaceId: z.string(),
                sessionId: z.string(),
            }),
            body: z.record(z.unknown()),
            response: {
                201: z.object({
                    id: z.string(),
                    sessionId: z.string(),
                    sender: z.string(),
                    content: z.string(),
                    status: z.string(),
                    createdAt: z.date(),
                    updatedAt: z.date(),
                }).describe("Created message"),
                401: z.object({
                    statusCode: z.number().default(401),
                    error: z.string(),
                    message: z.string()
                }).describe("Unauthorized"),
            }
        }
    }, async (request, reply) => {
        request.logger.info(`creating new message. interfaceId: ${request.params.interfaceId} of sessionId: ${request.params.sessionId}`)

        const newMessage = await messageUseCases.createMessage(
            {
                body: request.body,
                sender: request.params.interfaceId,
                status: "pending"
            },
            request.params.projectId,
            request.params.interfaceId,
            request.params.sessionId
        )

        request.logger.info(`created new message. interfaceId: ${request.params.interfaceId} of sessionId: ${request.params.sessionId}. id: ${newMessage.id}`)
        return reply.status(201).send(newMessage)
    })

    app.get("/projects/:projectId/interfaces/:interfaceId/sessions/:sessionId/messages/:messageId", {
        preHandler: authorization.authorize,
        schema: {
            ...defaultSchema,
            security: [
                {
                    bearerAuth: [],
                },
            ],
            description: "Fetch a message",
            params: z.object({
                projectId: z.string(),
                interfaceId: z.string(),
                sessionId: z.string(),
                messageId: z.string(),
            }),
            response: {
                200: z.object({
                    id: z.string(),
                    sessionId: z.string(),
                    sender: z.string(),
                    content: z.string(),
                    status: z.string(),
                    createdAt: z.date(),
                    updatedAt: z.date(),
                }).describe("Fetched message"),
                401: z.object({
                    statusCode: z.number().default(401),
                    error: z.string(),
                    message: z.string()
                }).describe("Unauthorized"),
            }
        }
    }, async (request, reply) => {
        const message = await messageUseCases.getMessage(request.params)

        return reply.status(200).send(message)
    })

    app.patch("/projects/:projectId/interfaces/:interfaceId/sessions/:sessionId/messages/:messageId/status", {
        preHandler: authorization.authorize,
        schema: {
            ...defaultSchema,
            security: [
                {
                    bearerAuth: [],
                },
            ],
            description: "Update message status.\n\n The message status can be `pending`, `error` or `delivered`\n\n`pending` -> message will be sent to the target or source interface\n`error` -> have some problem when tried to send the message\n`delivered` -> the message has been sent with success",
            params: z.object({
                projectId: z.string(),
                interfaceId: z.string(),
                sessionId: z.string(),
                messageId: z.string(),
            }),
            body: z.object({
                status: z.string(),
            }),
            response: {
                200: z.object({
                    id: z.string(),
                    sessionId: z.string(),
                    sender: z.string(),
                    content: z.string(),
                    status: z.string(),
                    createdAt: z.date(),
                    updatedAt: z.date(),
                }).describe("Updated status message"),
                401: z.object({
                    statusCode: z.number().default(401),
                    error: z.string(),
                    message: z.string()
                }).describe("Unauthorized"),
            }
        }
    }, async (request, reply) => {
        const updatedMessage = await messageUseCases.updateMessage({
            ...request.body,
            messageId: request.params.messageId
        })

        return reply.status(200).send(updatedMessage)
    })

    app.delete("/projects/:projectId/interfaces/:interfaceId/sessions/:sessionId/messages/:messageId", {
        preHandler: authorization.authorize,
        schema: {
            ...defaultSchema,
            security: [
                {
                    bearerAuth: [],
                },
            ],
            description: "Delete a message",
            params: z.object({
                projectId: z.string(),
                interfaceId: z.string(),
                sessionId: z.string(),
                messageId: z.string(),
            }),
            response: {
                204: z.void().describe("Deleted message"),
                401: z.object({
                    statusCode: z.number().default(401),
                    error: z.string(),
                    message: z.string()
                }).describe("Unauthorized"),
            }
        }
    }, async (request, reply) => {
        await messageUseCases.deleteMessage(request.params)

        return reply.status(204).send()
    })
}
