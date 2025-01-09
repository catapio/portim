import { Http } from "src/interfaces/http";
import { Session } from "../entities/Session";
import { InterfaceService } from "../services/interfaces";
import { SessionService } from "../services/sessions";
import { CommonError } from "../utils/commonError";
import { logger } from "../utils/logger";

export interface CreateSessionDTO {
    clientId: string
}

export interface GetSessionDTO {
    sessionId: string
}

export interface UpdateSessionDTO {
    sessionId: string
    target: string
    metadata?: Record<string, unknown>
}

export interface DeleteSessionDTO {
    sessionId: string
}

export interface ISessionUseCases {
    createSession: (sessionData: CreateSessionDTO, interfaceId: string) => Promise<Session>
    getSession: (sessionData: GetSessionDTO) => Promise<Session>
    updateSession: (sessionData: UpdateSessionDTO) => Promise<Session>
    deleteSession: (sessionData: DeleteSessionDTO) => Promise<void>
}

export class SessionUseCases implements ISessionUseCases {
    private sessionService: SessionService
    private interfaceService: InterfaceService
    private http: Http

    constructor(sessionService: SessionService, interfaceService: InterfaceService, http: Http) {
        this.sessionService = sessionService
        this.interfaceService = interfaceService
        this.http = http
    }

    async createSession({ clientId }: CreateSessionDTO, interfaceId: string) {
        const interfaceInst = await this.interfaceService.findById(interfaceId)
        if (!interfaceInst.control) throw new CommonError("Interface must have a control interface as default")

        const session = new Session({
            id: "",
            source: interfaceId,
            clientId,
            target: interfaceInst.control,
            createdAt: new Date(),
            updatedAt: new Date(),
        })

        const newSession = await this.sessionService.create(session)
        logger.debug(`created new session in database. source: ${interfaceId}. id: ${newSession.id}. target: ${newSession.target}`)

        return newSession
    }

    async getSession({ sessionId }: GetSessionDTO) {
        const session = await this.sessionService.findById(sessionId)

        return session
    }

    async updateSession({ sessionId, target, metadata }: UpdateSessionDTO) {
        logger.debug(`update sessin id ${sessionId}`)
        const session = await this.sessionService.findById(sessionId)

        if (!target.trim()) return session

        session.target = target

        const sessionUpdated = await this.sessionService.update(session)

        const interfaceInst = await this.interfaceService.findById(sessionUpdated.target)
        if (interfaceInst.controlEndpoint) {
            await this.http.post(interfaceInst.controlEndpoint, metadata, {
                headers: {
                    "catapio-session-id": session.id
                }
            })
        }

        logger.debug(`updated session id ${sessionUpdated.id}`)
        return sessionUpdated
    }

    async deleteSession({ sessionId }: DeleteSessionDTO) {
        logger.debug(`deleting session. id: ${sessionId}`)
        await this.sessionService.delete(sessionId)

        logger.debug(`success deleted session. id: ${sessionId}`)
    }
}
