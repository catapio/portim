import { FastifyRequest } from "fastify"
import { Auth } from "../interfaces/auth"
import { CommonError } from "../utils/commonError"
import { InterfaceService } from "../services/interfaces"
import { Interface } from "../entities/Interface"
import { logger } from "../utils/logger"
import { validateSecret } from "../utils/secretHash"

export class Authorization {
    auth: Auth
    interfaceService: InterfaceService

    constructor(auth: Auth, interfaceService: InterfaceService) {
        this.auth = auth
        this.interfaceService = interfaceService

        this.authorize = this.authorize.bind(this)
    }

    async authorize(request: FastifyRequest) {
        const authHeader = request.headers['authorization']
        if (!authHeader) {
            throw new CommonError("No token found", "Unauthorized", 401)
        }

        const [type, token] = authHeader.split(" ")
        if (!token || (type.toLowerCase() !== "bearer" && type.toLowerCase() !== "basic")) {
            throw new CommonError("Invalid token format", "Unauthorized", 401)
        }

        if (type.toLowerCase() === "basic") {
            const decoded = Buffer.from(token, "base64").toString("utf-8")
            const [username, password] = decoded.split(":")
            if (!username || !password) throw new CommonError("Invalid token", "Unauthorized", 401)

            let interfaceInst: Interface | null = null
            try {
                interfaceInst = await this.interfaceService.findById(username)
            } catch (err) {
                throw new CommonError("Invalid interface", "Unauthorized", 401)
            }

            if (!interfaceInst) {
                logger.error("interfaceInst is not filled in authorization, this should not happen")
                throw new Error("unexpected error")
            }

            const validSecret = validateSecret(password, interfaceInst.secretHash, interfaceInst.secretSalt)
            if (validSecret) {
                const params = request.params as { projectId: string }
                if (params.projectId && interfaceInst.projectId !== params.projectId) {
                    throw new CommonError("This interface cannot access this project", "Unauthorized", 401)
                }

                request.projectId = params.projectId

                return
            }
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

