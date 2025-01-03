import { logger } from "../utils/logger";
import { CommonError } from "../utils/commonError";
import { PrismaClient } from "@prisma/client";
import { Client } from "../entities/Client";
import { InputJsonValue } from "@prisma/client/runtime/library";

export interface IClientService {
    findById: (clientId: string) => Promise<Client>
    findByExternalId: (externalId: string) => Promise<Client>
    create: (client: Client) => Promise<Client>
    update: (client: Client) => Promise<Client>
    delete: (clientId: string) => Promise<Client>
}

export class ClientService implements IClientService {
    private prisma: PrismaClient

    constructor(prisma: PrismaClient) {
        this.prisma = prisma
    }

    /**
    * Find a client by id and it may throw an error if fetch fails.
    * @throws {Error} If the search fails.
    */
    async findById(clientId: string) {
        logger.debug(`finding client in database. id: ${clientId}`)
        const client = await this.prisma.client.findUnique({
            where: {
                id: clientId
            }
        })
        if (!client) throw new CommonError("Client does not exists")

        logger.debug(`found client in database. id: ${client.id}`)

        return new Client({
            ...client,
            metadata: client.metadata as Record<string, unknown> || {}
        })
    }

    /**
    * Find a client by externalId and it may throw an error if fetch fails.
    * @throws {Error} If the search fails.
    */
    async findByExternalId(externalId: string) {
        logger.debug(`finding client in database. externalId: ${externalId}`)
        const client = await this.prisma.client.findFirst({
            where: {
                externalId: externalId
            }
        })
        if (!client) throw new CommonError("Client does not exists")

        logger.debug(`found client by external id in database. id: ${client.id}`)

        return new Client({
            ...client,
            metadata: client.metadata as Record<string, unknown> || {}
        })
    }

    /**
    * Creates a client and it may throw an error if creation fails.
    * @throws {Error} If the creation fails.
    */
    async create(client: Client) {
        logger.debug("creating client in database")
        const newClient = await this.prisma.client.create({
            data: {
                externalId: client.externalId,
                metadata: client.metadata as InputJsonValue,
                projectId: client.projectId,
            }
        })
        logger.debug(`created client in database. id: ${newClient.id}`)

        return new Client({
            ...newClient,
            metadata: newClient.metadata as Record<string, unknown> || {}
        })
    }

    /**
    * Updates a client and it may throw an error if update fails.
    * @throws {Error} If the update fails.
    */
    async update(client: Client) {
        try {
            logger.debug(`updating client in database. id: ${client.id}`)
            const clientUpdated = await this.prisma.client.update({
                where: {
                    id: client.id
                },
                data: {
                    externalId: client.externalId,
                    metadata: client.metadata as InputJsonValue,
                    projectId: client.projectId,
                }
            })
            logger.debug(`updated client in database. id: ${clientUpdated.id}`)

            return new Client({
                ...clientUpdated,
                metadata: clientUpdated.metadata as Record<string, unknown> || {}
            })
        } catch (err) {
            logger.error(err)
            throw new CommonError("Not found client to update")
        }
    }

    /**
    * Deletes a client and it may throw an error if deletion fails.
    * @throws {Error} If the deletion fails.
    */
    async delete(clientId: string) {
        try {

            logger.debug(`deleting client in database. id: ${clientId}`)
            const clientDeleted = await this.prisma.client.delete({
                where: {
                    id: clientId
                }
            })
            logger.debug(`deleted client in database. id: ${clientDeleted.id}`)

            return new Client({
                ...clientDeleted,
                metadata: clientDeleted.metadata as Record<string, unknown> || {}
            })
        } catch (err) {
            logger.error(err)
            throw new CommonError("Not found client to delete")
        }
    }
}
