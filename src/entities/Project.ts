export interface IProject {
    id: string
    name: string
    createdAt: Date
    updatedAt: Date
    ownerId: string
    users: string[]
}

export class Project {
    id: string
    name: string
    createdAt: Date
    updatedAt: Date
    ownerId: string
    users: string[]

    constructor({ id, name, createdAt, updatedAt, ownerId, users }: IProject) {
        this.id = id
        this.name = name
        this.createdAt = createdAt
        this.updatedAt = updatedAt
        this.ownerId = ownerId
        this.users = users
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            createdAt: this.createdAt.toISOString(),
            updatedAt: this.updatedAt.toISOString(),
            ownerId: this.ownerId,
            users: this.users,
        };
    }

    addUser(userId: string) {
        this.users.push(userId)
    }

    removeUser(userId: string) {
        this.users = this.users.filter((id) => id !== userId)
    }
}
