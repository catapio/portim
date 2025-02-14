import z from "zod";
import { FastifyTypedInstance } from "../types";
import { IUserUseCases } from "../usecases/users";

const defaultSchema = {
    tags: ["Users"]
}

export async function userRoutes(app: FastifyTypedInstance, userUseCases: IUserUseCases) {
    app.post("/users/signup", {
        schema: {
            ...defaultSchema,
            description: "Create a new user",
            consumes: ['application/x-www-form-urlencoded'],
            body: z.object({
                firstName: z.string(),
                lastName: z.string(),
                email: z.string().email(),
                password: z.string(),
            }),
            response: {
                201: z.object({
                    id: z.string(),
                    email: z.string(),
                    firstName: z.string(),
                    lastName: z.string(),
                    projects: z.array(z.string()),
                }).describe("User created"),
            }
        }
    }, async (request, reply) => {
        request.logger.info("creating new user")
        const result = await userUseCases.createUser(request.body)
        request.logger.info(`created new user id: ${result.id}`)

        return reply.status(201).send(result)
    })

    app.post("/users/signin", {
        schema: {
            ...defaultSchema,
            description: "Authenticate user",
            consumes: ['application/x-www-form-urlencoded'],
            body: z.object({
                email: z.string().email(),
                password: z.string().describe("**HERE IN SWAGGER YOUR PASSWORD WILL BE SHOWN**"),
            }),
            response: {
                201: z.object({
                    tokenType: z.string(),
                    accessToken: z.string(),
                    refreshToken: z.string(),
                    expiresIn: z.number()
                }).describe("User created"),
            }
        }
    }, async (request, reply) => {
        request.logger.info("authenticating user")
        const result = await userUseCases.authenticateUser(request.body)
        request.logger.info("authenticated")

        return reply.status(201).send(result)
    })
}
