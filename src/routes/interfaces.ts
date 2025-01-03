import z from "zod";
import { FastifyTypedInstance } from "../types";
import { Authorization } from "../middlewares/authorize";
import { InterfaceUseCases } from "../usecases/interfaces";

const defaultSchema = {
    security: [
        {
            bearerAuth: [],
        },
    ],
    tags: ["Interfaces"]
}

export async function interfaceRoutes(app: FastifyTypedInstance, authorization: Authorization, interfaceUseCases: InterfaceUseCases) {
    app.post("/projects/:projectId/interfaces", {
        preHandler: authorization.authorize,
        schema: {
            ...defaultSchema,
            description: "Create interface",
            params: z.object({
                projectId: z.string()
            }),
            body: z.object({
                name: z.string().min(3),
                eventEndpoint: z.string().url().refine(
                    (url) => url.startsWith("https"),
                    { message: "The URL must starts with 'https'" }
                ),
                controlEndpoint: z.string().url().refine(
                    (url) => url.startsWith("https"),
                    { message: "The URL must starts with 'https'" }
                ).optional(),
                externalIdField: z.string(),
                control: z.string().optional(),
            }),
            response: {
                201: z.object({
                    id: z.string(),
                    name: z.string(),
                    eventEndpoint: z.string(),
                    controlEndpoint: z.string(),
                    control: z.string().nullable(),
                    externalIdField: z.string(),
                    projectId: z.string(),
                    createdAt: z.date(),
                    updatedAt: z.date(),
                }).describe("Created interface"),
                401: z.object({
                    statusCode: z.number().default(401),
                    error: z.string(),
                    message: z.string()
                }).describe("Unauthorized"),
            }
        }
    }, async (request, reply) => {
        request.logger.info(`creating new interface. name: ${request.body.name}`)

        const newInterface = await interfaceUseCases.createInterface(request.body, request.params.projectId)

        request.logger.info(`created new interface. name: ${request.body.name}. id: ${newInterface.id}`)
        return reply.status(201).send(newInterface)
    })

    app.get("/projects/:projectId/interfaces/:interfaceId", {
        preHandler: authorization.authorize,
        schema: {
            ...defaultSchema,
            description: "Fetch an interface",
            params: z.object({
                projectId: z.string(),
                interfaceId: z.string(),
            }),
            response: {
                200: z.object({
                    id: z.string(),
                    name: z.string(),
                    eventEndpoint: z.string(),
                    controlEndpoint: z.string(),
                    control: z.string().nullable(),
                    externalIdField: z.string(),
                    projectId: z.string(),
                    createdAt: z.date(),
                    updatedAt: z.date(),
                }).describe("Fetched interface"),
                401: z.object({
                    statusCode: z.number().default(401),
                    error: z.string(),
                    message: z.string()
                }).describe("Unauthorized"),
            }
        }
    }, async (request, reply) => {
        const interfaceInst = await interfaceUseCases.getInterface(request.params)

        return reply.status(200).send(interfaceInst)
    })

    app.put("/projects/:projectId/interfaces/:interfaceId", {
        preHandler: authorization.authorize,
        schema: {
            ...defaultSchema,
            description: "Update an interface",
            params: z.object({
                projectId: z.string(),
                interfaceId: z.string(),
            }),
            body: z.object({
                name: z.string().optional(),
                eventEndpoint: z.string().optional(),
                controlEndpoint: z.string().optional(),
                control: z.string().optional(),
                externalIdField: z.string().optional(),
            }),
            response: {
                200: z.object({
                    id: z.string(),
                    name: z.string(),
                    eventEndpoint: z.string(),
                    controlEndpoint: z.string(),
                    control: z.string().nullable(),
                    externalIdField: z.string(),
                    projectId: z.string(),
                    createdAt: z.date(),
                    updatedAt: z.date(),
                }).describe("Updated interface"),
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
        const updatedInstance = await interfaceUseCases.updateInterface({
            ...request.body,
            interfaceId: request.params.interfaceId
        })

        return reply.status(200).send(updatedInstance)
    })

    app.delete("/projects/:projectId/instances/:instanceId", {
        preHandler: authorization.authorize,
        schema: {
            ...defaultSchema,
            description: "Delete an interface",
            params: z.object({
                projectId: z.string(),
                interfaceId: z.string(),
            }),
            response: {
                204: z.void().describe("Deleted interface"),
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
        await interfaceUseCases.deleteInterface(request.params)

        return reply.status(204).send()
    })
}

