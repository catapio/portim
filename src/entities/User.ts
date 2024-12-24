export class User {
    id: string
    email: string
    firstName: string
    lastName: string
    organizationId: string
    createdAt: Date
    updatedAt: Date

    constructor(
        id: string,
        email: string,
        firstName: string,
        lastName: string,
        organizationId: string,
        createdAt: Date,
        updatedAt: Date
    ) {
        this.id = id
        this.email = email
        this.firstName = firstName
        this.lastName = lastName
        this.organizationId = organizationId
        this.createdAt = createdAt
        this.updatedAt = updatedAt
    }
}
