export interface IMessage {
    id: string
    sessionId: string
    sender: string
    content: string
    status: string
    createdAt: Date
    updatedAt: Date
}

export class Message implements IMessage {
    id: string
    sessionId: string
    sender: string
    content: string
    status: string
    createdAt: Date
    updatedAt: Date

    constructor({
        id,
        sessionId,
        sender,
        content,
        status,
        createdAt,
        updatedAt,
    }: IMessage) {
        this.id = id
        this.sessionId = sessionId
        this.sender = sender
        this.content = content
        this.status = status
        this.createdAt = createdAt
        this.updatedAt = updatedAt
    }

    toJSON() {
        return {
            id: this.id,
            sessionId: this.sessionId,
            sender: this.sender,
            content: this.content,
            status: this.status,
            createdAt: this.createdAt.toISOString(),
            updatedAt: this.updatedAt.toISOString(),
        }
    }
}
