import z from "zod";
import { FastifyTypedInstance } from "../types";
import { Authorization } from "../middlewares/authorize";
import { CommonError } from "../utils/commonError";
import { ProjectUseCases } from "../usecases/projects";

const defaultSchema = {
    security: [
        {
            bearerAuth: [],
        },
    ],
    tags: ["Projects"]
}

export async function projectRoutes(app: FastifyTypedInstance, authorization: Authorization, projectUseCases: ProjectUseCases) {
    app.post("/projects", {
        preHandler: authorization.authorize,
        schema: {
            ...defaultSchema,
            description: "Create project.\n\nThe projects is where you can create interfaces and control the sessions of your clients with your system. You can add users of your company to control the project creating interfaces and controling sessions",
            body: z.object({
                name: z.string()
            }),
            response: {
                201: z.object({
                    id: z.string(),
                    name: z.string(),
                    createdAt: z.date(),
                    updatedAt: z.date(),
                    ownerId: z.string(),
                    users: z.array(z.string()),
                }).describe("Created project"),
                401: z.object({
                    statusCode: z.number().default(401),
                    error: z.string(),
                    message: z.string()
                }).describe("Unauthorized"),
            }
        }
    }, async (request, reply) => {
        request.logger.info(`creating new project. name: ${request.body.name}`)

        if (!request.user) {
            throw new CommonError("No user to assign project")
        }

        const newProject = await projectUseCases.createProject(request.body, request.user)

        request.logger.info(`created new project. name: ${request.body.name}. id: ${newProject.id}`)
        return reply.status(201).send(newProject)
    })

    app.get("/projects/:projectId", {
        preHandler: authorization.authorize,
        schema: {
            ...defaultSchema,
            description: "Fetch a project",
            params: z.object({
                projectId: z.string()
            }),
            response: {
                200: z.object({
                    id: z.string(),
                    name: z.string(),
                    createdAt: z.date(),
                    updatedAt: z.date(),
                    ownerId: z.string(),
                    users: z.array(z.string())
                }).describe("Fetched project"),
                401: z.object({
                    statusCode: z.number().default(401),
                    error: z.string(),
                    message: z.string()
                }).describe("Unauthorized"),
            }
        }
    }, async (request, reply) => {
        const project = await projectUseCases.getProject(request.params)

        return reply.status(200).send(project)
    })

    app.patch("/projects/:projectId/addUser", {
        preHandler: authorization.authorize,
        schema: {
            ...defaultSchema,
            description: "Add user to a project",
            params: z.object({
                projectId: z.string()
            }),
            body: z.object({
                userId: z.string()
            }),
            response: {
                200: z.object({
                    id: z.string(),
                    name: z.string(),
                    createdAt: z.date(),
                    updatedAt: z.date(),
                    ownerId: z.string(),
                    users: z.array(z.string())
                }).describe("Updated project"),
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
        if (!request.user) throw new CommonError("no user to identify and add user to the project")

        const updatedProject = await projectUseCases.addUserToProject({
            projectId: request.params.projectId,
            requestUser: request.user,
            userId: request.body.userId
        })

        return reply.status(200).send(updatedProject)
    })

    app.patch("/projects/:projectId/removeUser", {
        preHandler: authorization.authorize,
        schema: {
            ...defaultSchema,
            description: "Add user to a project",
            params: z.object({
                projectId: z.string()
            }),
            body: z.object({
                userId: z.string()
            }),
            response: {
                200: z.object({
                    id: z.string(),
                    name: z.string(),
                    createdAt: z.date(),
                    updatedAt: z.date(),
                    ownerId: z.string(),
                    users: z.array(z.string())
                }).describe("Updated project"),
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
        if (!request.user) throw new CommonError("no user to identify and add user to the project")

        const updatedProject = await projectUseCases.removeUserOfProject({
            projectId: request.params.projectId,
            requestUser: request.user,
            userId: request.body.userId
        })

        return reply.status(200).send(updatedProject)
    })

    app.delete("/projects/:projectId", {
        preHandler: authorization.authorize,
        schema: {
            ...defaultSchema,
            description: "Delete a project",
            params: z.object({
                projectId: z.string()
            }),
            response: {
                204: z.void().describe("Deleted project"),
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
        if (!request.user) throw new CommonError("no user to identify and delete the project")

        await projectUseCases.deleteProject({
            projectId: request.params.projectId,
            userId: request.user.id
        })

        return reply.status(204).send()
    })
}

