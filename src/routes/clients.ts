import z from "zod";
import { FastifyTypedInstance } from "../types";
import { Authorization } from "../middlewares/authorize";
import { ClientUseCases } from "../usecases/clients";

const defaultSchema = {
    security: [
        {
            bearerAuth: [],
        },
    ],
    tags: ["Clients"]
}

export async function clientRoutes(app: FastifyTypedInstance, authorization: Authorization, clientUseCases: ClientUseCases) {
    app.post("/projects/:projectId/clients", {
        preHandler: authorization.authorize,
        schema: {
            ...defaultSchema,
            description: "Create client",
            params: z.object({
                projectId: z.string()
            }),
            body: z.object({
                externalId: z.string(),
                metadata: z.record(z.unknown()).optional()
            }),
            response: {
                201: z.object({
                    id: z.string(),
                    projectId: z.string(),
                    externalId: z.string(),
                    metadata: z.record(z.unknown()),
                    createdAt: z.date(),
                    updatedAt: z.date()
                }).describe("Created client"),
                401: z.object({
                    statusCode: z.number().default(401),
                    error: z.string(),
                    message: z.string()
                }).describe("Unauthorized"),
            }
        }
    }, async (request, reply) => {
        request.logger.info(`creating new client. externalId: ${request.body.externalId}`)

        const newClient = await clientUseCases.createClient(request.body, request.params.projectId)

        request.logger.info(`created new client. externalId: ${request.body.externalId}. id: ${newClient.id}`)
        return reply.status(201).send(newClient)
    })

    app.get("/projects/:projectId/clients/:clientId", {
        preHandler: authorization.authorize,
        schema: {
            ...defaultSchema,
            description: "Fetch a client",
            params: z.object({
                projectId: z.string(),
                clientId: z.string(),
            }),
            response: {
                200: z.object({
                    id: z.string(),
                    projectId: z.string(),
                    externalId: z.string(),
                    metadata: z.record(z.unknown()),
                    createdAt: z.date(),
                    updatedAt: z.date()
                }).describe("Fetched client"),
                401: z.object({
                    statusCode: z.number().default(401),
                    error: z.string(),
                    message: z.string()
                }).describe("Unauthorized"),
            }
        }
    }, async (request, reply) => {
        const client = await clientUseCases.getClient(request.params)

        return reply.status(200).send(client)
    })

    app.put("/projects/:projectId/clients/:clientId", {
        preHandler: authorization.authorize,
        schema: {
            ...defaultSchema,
            description: "Update a client",
            params: z.object({
                projectId: z.string(),
                clientId: z.string(),
            }),
            body: z.object({
                metadata: z.record(z.unknown()),
            }),
            response: {
                200: z.object({
                    id: z.string(),
                    projectId: z.string(),
                    externalId: z.string(),
                    metadata: z.record(z.unknown()),
                    createdAt: z.date(),
                    updatedAt: z.date()
                }).describe("Updated client"),
                401: z.object({
                    statusCode: z.number().default(401),
                    error: z.string(),
                    message: z.string()
                }).describe("Unauthorized"),
            }
        }
    }, async (request, reply) => {
        const updatedClient = await clientUseCases.updateClient({
            ...request.body,
            clientId: request.params.clientId
        })

        return reply.status(200).send(updatedClient)
    })

    app.delete("/projects/:projectId/clients/:clientId", {
        preHandler: authorization.authorize,
        schema: {
            ...defaultSchema,
            description: "Delete a client",
            params: z.object({
                projectId: z.string(),
                clientId: z.string(),
            }),
            response: {
                204: z.void().describe("Deleted client"),
                401: z.object({
                    statusCode: z.number().default(401),
                    error: z.string(),
                    message: z.string()
                }).describe("Unauthorized"),
            }
        }
    }, async (request, reply) => {
        await clientUseCases.deleteClient(request.params)

        return reply.status(204).send()
    })
}

