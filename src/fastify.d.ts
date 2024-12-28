import { FastifyRequest } from "fastify";
import type { Logger } from "winston";
import { User } from "./entities/User";

declare module "fastify" {
    interface FastifyRequest {
        logger: Logger
        projectId?: string
        user?: User;
    }
}
