import z from "zod";
import { FastifyTypedInstance } from "../types";
import { Authorization } from "../middlewares/authorize";

export async function projectRoutes(app: FastifyTypedInstance, authorization: Authorization) {
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
            params: z.object({
                projectId: z.string()
            }),
            response: {
                200: z.object({
                    id: z.string()
                }).describe("Created project"),
                401: z.object({
                    statusCode: z.number().default(401),
                    error: z.string(),
                    message: z.string()
                }).describe("Unauthorized"),
            }
        }
    }, async (request, reply) => {
        return reply.status(201).send({ id: "test" })
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
                    id: z.string()
                }).describe("Fetched project"),
                401: z.object({
                    statusCode: z.number().default(401),
                    error: z.string(),
                    message: z.string()
                }).describe("Unauthorized"),
            }
        }
    }, async (request, reply) => {
        console.log(request.user)
        return reply.status(201).send({ id: "test" })
    })
}

