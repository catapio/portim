import { logger } from "../utils/logger";
import { CommonError } from "../utils/commonError";
import { PrismaClient } from "@prisma/client";
import { Session } from "../entities/Sessions";

export interface ISessionService {
    findById: (sessionId: string) => Promise<Session>
    create: (session: Session) => Promise<Session>
    update: (session: Session) => Promise<Session>
    delete: (sessionId: string) => Promise<Session>
}

export class SessionService implements ISessionService {
    private prisma: PrismaClient

    constructor(prisma: PrismaClient) {
        this.prisma = prisma
    }

    /**
    * Find a session by id and it may throw an error if fetch fails.
    * @throws {Error} If the search fails.
    */
    async findById(sessionId: string) {
        logger.debug(`finding session in database. id: ${sessionId}`)
        const session = await this.prisma.session.findUnique({
            where: {
                id: sessionId
            }
        })
        if (!session) throw new CommonError("Session does not exists")

        logger.debug(`found session in database. id: ${session.id}`)

        return new Session(session)
    }

    /**
    * Creates a session and it may throw an error if creation fails.
    * @throws {Error} If the creation fails.
    */
    async create(session: Session) {
        logger.debug("creating session in database")
        const newSession = await this.prisma.session.create({
            data: {
                source: session.source,
                target: session.target,
                clientId: session.clientId,
            }
        })
        logger.debug(`created session in database. id: ${newSession.id}`)

        return new Session(newSession)
    }

    /**
    * Updates a session and it may throw an error if update fails.
    * @throws {Error} If the update fails.
    */
    async update(session: Session) {
        try {
            logger.debug(`updating session in database. id: ${session.id}`)
            const sessionUpdated = await this.prisma.session.update({
                where: {
                    id: session.id
                },
                data: {
                    source: session.source,
                    target: session.target,
                    clientId: session.clientId,
                }
            })
            logger.debug(`updated session in database. id: ${sessionUpdated.id}`)

            return new Session(sessionUpdated)
        } catch (err) {
            logger.error(err)
            throw new CommonError("Not found session to update")
        }
    }

    /**
    * Deletes a session and it may throw an error if deletion fails.
    * @throws {Error} If the deletion fails.
    */
    async delete(sessionId: string) {
        try {

            logger.debug(`deleting session in database. id: ${sessionId}`)
            const sessionDeleted = await this.prisma.session.delete({
                where: {
                    id: sessionId
                }
            })
            logger.debug(`deleted session in database. id: ${sessionDeleted.id}`)

            return new Session(sessionDeleted)
        } catch (err) {
            logger.error(err)
            throw new CommonError("Not found session to delete")
        }
    }
}
