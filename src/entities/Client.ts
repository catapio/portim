import { ISession } from "./Session"

export interface IClient {
    id: string
    projectId: string
    externalId: string
    metadata: Record<string, unknown>
    sessions?: ISession[]
    createdAt: Date
    updatedAt: Date
}

export class Client implements IClient {
    id: string
    projectId: string
    externalId: string
    metadata: Record<string, unknown>
    sessions?: ISession[]
    createdAt: Date
    updatedAt: Date

    constructor({
        id,
        projectId,
        externalId,
        metadata,
        sessions,
        createdAt,
        updatedAt,
    }: IClient) {
        this.id = id
        this.projectId = projectId
        this.externalId = externalId
        this.metadata = metadata
        this.sessions = sessions
        this.createdAt = createdAt
        this.updatedAt = updatedAt
    }

    toJSON() {
        return {
            id: this.id,
            projectId: this.projectId,
            externalId: this.externalId,
            metadata: this.metadata,
            sessions: this.sessions,
            createdAt: this.createdAt.toISOString(),
            updatedAt: this.updatedAt.toISOString(),
        }
    }
}
