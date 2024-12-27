import z from "zod";
import { FastifyTypedInstance } from "../types";
import { IUserService } from "../services/users";
import { User } from "../entities/User";

export async function userRoutes(app: FastifyTypedInstance, userService: IUserService) {
    app.post("/users/signup", {
        schema: {
            tags: ["Users"],
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
                    id: z.string()
                }).describe("User created"),
            }
        }
    }, async (request, reply) => {
        const { email, firstName, lastName, password } = request.body
        const user = new User(
            "",
            email,
            firstName,
            lastName,
            "",
            new Date(),
            new Date(),
        )

        request.logger.info("creating new user")
        const result = await userService.create(user, password)
        request.logger.info(`created new user id: ${result.id}`)

        return reply.status(201).send(result)
    })

    app.post("/users/signin", {
        schema: {
            tags: ["Users"],
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
        const { email, password } = request.body

        request.logger.info("authenticating user")
        const result = await userService.authenticate(email, password)
        request.logger.info("authenticated user id")

        return reply.status(201).send(result)
    })
}
