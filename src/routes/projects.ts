import z from "zod";
import { FastifyTypedInstance } from "../types";
import { Authorization } from "../middlewares/authorize";
import { IUserService } from "../services/users";
import { IProjectService } from "../services/projects";
import { Project } from "../entities/Project";
import { CommonError } from "../utils/commonError";

export async function projectRoutes(app: FastifyTypedInstance, authorization: Authorization, userService: IUserService, projectService: IProjectService) {
    app.post("/projects", {
        preHandler: authorization.authorize,
        schema: {
            security: [
                {
                    bearerAuth: [],
                },
            ],
            tags: ["Projects"],
            description: "Create project",
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
                }).describe("Created project"),
                401: z.object({
                    statusCode: z.number().default(401),
                    error: z.string(),
                    message: z.string()
                }).describe("Unauthorized"),
            }
        }
    }, async (request, reply) => {
        const { name } = request.body
        request.logger.info(`creating new project. name: ${name}`)
        if (!request.user || !request.user?.id) {
            throw new CommonError("No user to assign project")
        }

        const project = new Project({
            id: "",
            name,
            createdAt: new Date(),
            updatedAt: new Date(),
            ownerId: request.user.id,
            users: [request.user.id]
        })

        const newProject = await projectService.create(project)
        request.logger.info(`created new project. name: ${name}. id: ${newProject.id}`)

        if (Array.isArray(request.user.metadata.projects) && request.user.metadata.projects.length) {
            request.user.metadata.projects.push(newProject.id)
        } else {
            request.user.metadata.projects = [newProject.id]
        }
        try {
            await userService.update(request.user.id, request.user.metadata)
        } catch (err) {
            // if got an error to assign the project to the user, the project must be deleted
            await projectService.delete(newProject.id)
            throw err
        }
        request.logger.info(`assign project name ${name} to user id ${request.user.id}`)

        return reply.status(201).send(newProject)
    })

    app.get("/projects/:projectId", {
        preHandler: authorization.authorize,
        schema: {
            security: [
                {
                    bearerAuth: [],
                },
            ],
            tags: ["Projects"],
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
                    ownerId: z.string()
                }).describe("Fetched project"),
                401: z.object({
                    statusCode: z.number().default(401),
                    error: z.string(),
                    message: z.string()
                }).describe("Unauthorized"),
            }
        }
    }, async (request, reply) => {
        const { projectId } = request.params
        const project = await projectService.findById(projectId)

        return reply.status(200).send(project)
    })

    app.delete("/projects/:projectId", {
        preHandler: authorization.authorize,
        schema: {
            security: [
                {
                    bearerAuth: [],
                },
            ],
            tags: ["Projects"],
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
            }
        }
    }, async (request, reply) => {
        const { projectId } = request.params
        const projectDeleted = await projectService.delete(projectId)

        try {
            for (const userId of projectDeleted.users) {
                const user = await userService.findById(userId)
                await userService.update(user.id, { projects: user.projects?.filter((id) => id !== projectId) })
            }
        } catch (err) {
            request.logger.error(err)
        }

        return reply.status(204).send()
    })

    // PATCH - add user [only owner can do this]
    // PATCH - remove user [only owner can do this]
}

