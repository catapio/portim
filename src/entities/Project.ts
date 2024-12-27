export class Project {
    id: string
    name: string
    createdAt: Date
    updatedAt: Date
    ownerId: string

    constructor(
        id: string,
        name: string,
        createdAt: Date,
        updatedAt: Date,
        ownerId: string
    ) {
        this.id = id
        this.name = name
        this.createdAt = createdAt
        this.updatedAt = updatedAt
        this.ownerId = ownerId
    }
}
