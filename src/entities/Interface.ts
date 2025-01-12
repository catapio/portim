import { ISession } from "./Session"

export interface IInterface {
    id: string
    name: string
    eventEndpoint: string
    controlEndpoint: string
    control: string | null
    externalIdField: string
    projectId: string
    secretHash: string
    secretSalt: string
    allowedIps: string[]
    secretToken: string | null
    ivToken: string | null
    sessions?: ISession[]
    createdAt: Date
    updatedAt: Date
}

export class Interface implements IInterface {
    id: string
    name: string
    eventEndpoint: string
    controlEndpoint: string
    control: string | null
    externalIdField: string
    projectId: string
    secretHash: string
    secretSalt: string
    allowedIps: string[]
    secretToken: string | null
    ivToken: string | null
    sessions?: ISession[]
    createdAt: Date
    updatedAt: Date

    constructor({
        id,
        name,
        eventEndpoint,
        controlEndpoint,
        control,
        externalIdField,
        projectId,
        createdAt,
        updatedAt,
        secretHash,
        secretSalt,
        secretToken,
        ivToken,
        sessions,
        allowedIps
    }: IInterface) {
        this.id = id
        this.name = name
        this.eventEndpoint = eventEndpoint
        this.controlEndpoint = controlEndpoint
        this.control = control
        this.externalIdField = externalIdField
        this.projectId = projectId
        this.secretHash = secretHash
        this.secretSalt = secretSalt
        this.allowedIps = allowedIps
        this.secretToken = secretToken
        this.ivToken = ivToken
        this.sessions = sessions
        this.createdAt = createdAt
        this.updatedAt = updatedAt
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            eventEndpoint: this.eventEndpoint,
            controlEndpoint: this.controlEndpoint,
            control: this.control,
            externalIdField: this.externalIdField,
            projectId: this.projectId,
            secretToken: this.secretToken,
            sessions: this.sessions,
            createdAt: this.createdAt.toISOString(),
            updatedAt: this.updatedAt.toISOString(),
        };
    }
}
