import { logger } from "../utils/logger";
import { CommonError } from "../utils/commonError";
import { PrismaClient } from "@prisma/client";
import { Message } from "../entities/Message";

export interface IMessageService {
    findById: (messageId: string) => Promise<Message>
    create: (message: Message) => Promise<Message>
    update: (message: Message) => Promise<Message>
    delete: (messageId: string) => Promise<Message>
}

export class MessageService implements IMessageService {
    private prisma: PrismaClient

    constructor(prisma: PrismaClient) {
        this.prisma = prisma
    }

    /**
    * Find a message by id and it may throw an error if fetch fails.
    * @throws {Error} If the search fails.
    */
    async findById(messageId: string) {
        logger.debug(`finding message in database. id: ${messageId}`)
        const message = await this.prisma.message.findUnique({
            where: {
                id: messageId
            }
        })
        if (!message) throw new CommonError("Message does not exists")

        logger.debug(`found message in database. id: ${message.id}`)

        return new Message(message)
    }

    /**
    * Creates a message and it may throw an error if creation fails.
    * @throws {Error} If the creation fails.
    */
    async create(message: Message) {
        logger.debug("creating message in database")
        const newMessage = await this.prisma.message.create({
            data: {
                sender: message.sender,
                sessionId: message.sessionId,
                status: message.status,
                content: message.content,
            }
        })
        logger.debug(`created message in database. id: ${newMessage.id}`)

        return new Message(newMessage)
    }

    /**
    * Updates a message and it may throw an error if update fails.
    * @throws {Error} If the update fails.
    */
    async update(message: Message) {
        try {
            logger.debug(`updating message in database. id: ${message.id}`)
            const messageUpdated = await this.prisma.message.update({
                where: {
                    id: message.id
                },
                data: {
                    sender: message.sender,
                    sessionId: message.sessionId,
                    status: message.status,
                    error: message.error,
                    content: message.content,
                }
            })
            logger.debug(`updated message in database. id: ${messageUpdated.id}`)

            return new Message(messageUpdated)
        } catch (err) {
            logger.error(err)
            throw new CommonError("Not found message to update")
        }
    }

    /**
    * Deletes a message and it may throw an error if deletion fails.
    * @throws {Error} If the deletion fails.
    */
    async delete(messageId: string) {
        try {

            logger.debug(`deleting message in database. id: ${messageId}`)
            const messageDeleted = await this.prisma.message.delete({
                where: {
                    id: messageId
                }
            })
            logger.debug(`deleted message in database. id: ${messageDeleted.id}`)

            return new Message(messageDeleted)
        } catch (err) {
            logger.error(err)
            throw new CommonError("Not found message to delete")
        }
    }
}
