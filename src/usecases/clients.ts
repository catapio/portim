import { Client } from "../entities/Client";
import { ClientService } from "../services/clients";
import { logger } from "../utils/logger";

export interface CreateClientDTO {
    externalId: string
    metadata?: Record<string, unknown>
}

export interface GetClientDTO {
    clientId: string
}

export interface UpdateClientDTO {
    clientId: string
    metadata: Record<string, unknown>
}

export interface DeleteClientDTO {
    clientId: string
}

export interface IClientUseCases {
    createClient: (clientData: CreateClientDTO, projectId: string) => Promise<Client>
    getClient: (clientData: GetClientDTO) => Promise<Client>
    updateClient: (clientData: UpdateClientDTO) => Promise<Client>
    deleteClient: (clientData: DeleteClientDTO) => Promise<void>
}

export class ClientUseCases implements IClientUseCases {
    private clientService: ClientService

    constructor(clientService: ClientService) {
        this.clientService = clientService
    }

    async createClient({ externalId, metadata }: CreateClientDTO, projectId: string) {
        const client = new Client({
            id: "",
            projectId,
            externalId,
            metadata: metadata || {},
            createdAt: new Date(),
            updatedAt: new Date(),
        })

        const newClient = await this.clientService.create(client)
        logger.debug(`created new client in database. externalId: ${externalId}. id: ${newClient.id} in project id: ${projectId}`)

        return newClient
    }

    async getClient({ clientId }: GetClientDTO) {
        const client = await this.clientService.findById(clientId)

        return client
    }

    async updateClient({ clientId, metadata }: UpdateClientDTO) {
        logger.debug(`update client id ${clientId}`)
        const client = await this.clientService.findById(clientId)

        client.metadata = Object.assign(client.metadata, metadata)

        const clientUpdated = await this.clientService.update(client)

        logger.debug(`updated client id ${clientUpdated.id}`)
        return clientUpdated
    }

    async deleteClient({ clientId }: DeleteClientDTO) {
        logger.debug(`deleting client. id: ${clientId}`)
        await this.clientService.delete(clientId)

        logger.debug(`success deleted client. id: ${clientId}`)
    }
}
