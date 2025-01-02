import { IMessage } from "./Message"

export interface ISession {
    id: string
    source: string
    target: string
    clientId: string
    messages?: IMessage[]
    createdAt: Date
    updatedAt: Date
}

export class Session implements ISession {
    id: string
    source: string
    target: string
    clientId: string
    messages?: IMessage[]
    createdAt: Date
    updatedAt: Date

    constructor({
        id,
        source,
        target,
        clientId,
        messages,
        createdAt,
        updatedAt,
    }: ISession) {
        this.id = id
        this.source = source
        this.target = target
        this.clientId = clientId
        this.messages = messages
        this.createdAt = createdAt
        this.updatedAt = updatedAt
    }

    toJSON() {
        return {
            id: this.id,
            source: this.source,
            target: this.target,
            clientId: this.clientId,
            messages: this.messages,
            createdAt: this.createdAt.toISOString(),
            updatedAt: this.updatedAt.toISOString(),
        }
    }
}
