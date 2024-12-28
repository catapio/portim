import { FastifyRequest } from "fastify"
import { Auth } from "../interfaces/auth"
import { CommonError } from "../utils/commonError"

export class Authorization {
    auth: Auth

    constructor(auth: Auth) {
        this.auth = auth

        this.authorize = this.authorize.bind(this)
    }

    async authorize(request: FastifyRequest) {
        const authHeader = request.headers['authorization']
        if (!authHeader) {
            throw new CommonError("No token found", "Unauthorized", 401)
        }

        const [type, token] = authHeader.split(" ")
        if (!token || type.toLowerCase() !== "bearer") {
            throw new CommonError("Invalid token format", "Unauthorized", 401)
        }

        const { user } = await this.auth.authorize(token)

        if (!user) {
            throw new CommonError("Invalid token", "Unauthorized", 401)
        }

        request.user = user

        const params = request.params as { projectId: string }
        if (params.projectId && !user.projects.includes(params.projectId)) {
            throw new CommonError("You cannot access this project", "Unauthorized", 401)
        }

        request.projectId = params.projectId
    };
}

