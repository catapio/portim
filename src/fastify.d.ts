import { FastifyRequest } from "fastify";
import type { Logger } from "winston";

declare module "fastify" {
    interface FastifyRequest {
        logger: Logger;
    }
}
