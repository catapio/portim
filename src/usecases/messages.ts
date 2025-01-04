import { Client } from "../entities/Client";
import { Message } from "../entities/Message";
import { Session } from "../entities/Session";
import { ClientService } from "../services/clients";
import { InterfaceService } from "../services/interfaces";
import { MessageService } from "../services/messages";
import { SessionService } from "../services/sessions";
import { CommonError } from "../utils/commonError";
import { getValueFromPath } from "../utils/getValueFromPath";
import { logger } from "../utils/logger";
import crypto from "node:crypto"

export interface CreateMessageDTO {
    sender: string
    status: string
    body: Record<string, unknown>
}

export interface GetMessageDTO {
    messageId: string
}

export interface UpdateMessageDTO {
    messageId: string
    status: string
}

export interface DeleteMessageDTO {
    messageId: string
}

export interface IMessageUseCases {
    createMessage: (messageData: CreateMessageDTO, projectId: string, interfaceId: string, sessionId: string) => Promise<Message>
    getMessage: (messageData: GetMessageDTO) => Promise<Message>
    updateMessage: (messageData: UpdateMessageDTO) => Promise<Message>
    deleteMessage: (messageData: DeleteMessageDTO) => Promise<void>
}

export class MessageUseCases implements IMessageUseCases {
    private messageService: MessageService
    private sessionService: SessionService
    private clientService: ClientService
    private interfaceService: InterfaceService

    constructor(messageService: MessageService, sessionService: SessionService, clientService: ClientService, interfaceService: InterfaceService) {
        this.messageService = messageService
        this.sessionService = sessionService
        this.clientService = clientService
        this.interfaceService = interfaceService
    }

    private async handleNoSessionIdMessage(body: Record<string, unknown>, projectId: string, interfaceId: string) {
        const interfaceInst = await this.interfaceService.findById(interfaceId)
        const externalId = getValueFromPath(body, interfaceInst.externalIdField)

        if (!interfaceInst.control) throw new CommonError("If no sessionId passed the interface must have a default control interface")
        if (!externalId) throw new CommonError("No external id found") // in future will be make a bypass

        let client: Client
        try {
            client = await this.clientService.findByExternalId(externalId)
        } catch (err: any) {
            logger.debug(`no client found, creating new one. error: ${err.message}`)
            const newClient = new Client({
                id: "",
                externalId: String(externalId),
                metadata: {},
                projectId,
                createdAt: new Date(),
                updatedAt: new Date(),
            })

            client = await this.clientService.create(newClient)
        }

        let session: Session | null = null
        try {
            session = await this.sessionService.findBySource(interfaceId, client.id)
        } catch (err) {
            const newSession = new Session({
                id: "",
                source: interfaceId,
                target: interfaceInst.control,
                clientId: client.id,
                createdAt: new Date(),
                updatedAt: new Date(),
            })

            session = await this.sessionService.create(newSession)
        }

        return session
    }

    async createMessage({ sender, body, status }: CreateMessageDTO, projectId: string, interfaceId: string, sessionId?: string) {
        let session: Session | null = null
        if (!sessionId) {
            session = await this.handleNoSessionIdMessage(body, projectId, interfaceId)
        } else {
            session = await this.sessionService.findById(sessionId)
        }

        if (!session) throw new CommonError("Not possible to assign message to a session")

        const message = new Message({
            id: "",
            sessionId: session.id,
            status,
            sender,
            content: crypto.createHash("sha256").update(JSON.stringify(body)).digest("hex"),
            createdAt: new Date(),
            updatedAt: new Date(),
        })

        const newMessage = await this.messageService.create(message)
        logger.debug(`created new message in database. source: ${interfaceId}. sessionId: ${session.id}. id: ${newMessage.id}`)

        if (session.source === sender) {
            const interfaceTarget = await this.interfaceService.findById(session.target)
            logger.info(`call target endpoint ${interfaceTarget.eventEndpoint}`)
        } else {
            const interfaceSource = await this.interfaceService.findById(session.source)
            logger.info(`call source endpoint ${interfaceSource.eventEndpoint}`)
        }

        return newMessage
    }

    async getMessage({ messageId }: GetMessageDTO) {
        const message = await this.messageService.findById(messageId)

        return message
    }

    async updateMessage({ messageId, status }: UpdateMessageDTO) {
        logger.debug(`update message id ${messageId}`)
        const message = await this.messageService.findById(messageId)

        message.status = status

        const messageUpdated = await this.messageService.update(message)

        logger.debug(`updated message id ${messageUpdated.id}`)
        return messageUpdated
    }

    async deleteMessage({ messageId }: DeleteMessageDTO) {
        logger.debug(`deleting message. id: ${messageId}`)
        await this.messageService.delete(messageId)

        logger.debug(`success deleted message. id: ${messageId}`)
    }
}
