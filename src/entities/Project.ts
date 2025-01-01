import { IClient } from "./Client"
import { IInterface } from "./Interface"

export interface IProject {
    id: string
    name: string
    createdAt: Date
    updatedAt: Date
    ownerId: string
    users: string[]
    interfaces: IInterface[]
    clients: IClient[]
}

export class Project implements IProject {
    id: string
    name: string
    createdAt: Date
    updatedAt: Date
    ownerId: string
    users: string[]
    interfaces: IInterface[]
    clients: IClient[]

    constructor({ id, name, createdAt, updatedAt, ownerId, users, interfaces, clients }: IProject) {
        this.id = id
        this.name = name
        this.ownerId = ownerId
        this.users = users
        this.interfaces = interfaces
        this.clients = clients
        this.createdAt = createdAt
        this.updatedAt = updatedAt
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            ownerId: this.ownerId,
            users: this.users,
            interfaces: this.interfaces,
            clients: this.clients,
            createdAt: this.createdAt.toISOString(),
            updatedAt: this.updatedAt.toISOString(),
        };
    }

    addUser(userId: string) {
        this.users.push(userId)
    }

    removeUser(userId: string) {
        this.users = this.users.filter((id) => id !== userId)
    }
}
