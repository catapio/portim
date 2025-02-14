export interface IUser {
    id: string
    email: string
    firstName: string
    lastName: string
    projects: string[]
}

export class User implements IUser {
    id: string
    email: string
    firstName: string
    lastName: string
    projects: string[]

    constructor({
        id,
        email,
        firstName,
        lastName,
        projects,
    }: IUser) {
        this.id = id
        this.email = email
        this.firstName = firstName
        this.lastName = lastName
        this.projects = projects
    }

    toJSON() {
        return {
            id: this.id,
            email: this.email,
            firstName: this.firstName,
            lastName: this.lastName,
            projects: this.projects,
        }
    }

    addProject(projectId: string) {
        this.projects.push(projectId)
    }

    removeProject(projectId: string) {
        this.projects = this.projects.filter((id) => id !== projectId)
    }
}
