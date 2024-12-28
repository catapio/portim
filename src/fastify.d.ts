import { FastifyRequest } from "fastify";
import type { Logger } from "winston";

declare module "fastify" {
    interface FastifyRequest {
        logger: Logger
        projectId?: string
        user?: {
            id: string,
            email?: string,
            metadata: {
                firstName: string
                lastName: string
                projects?: string[]
            }
        };
    }
}
