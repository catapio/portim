import { Project } from "../entities/Project";
import { User } from "../entities/User";
import { ProjectService } from "../services/projects";
import { UserService } from "../services/users";
import { CommonError } from "../utils/commonError";
import { logger } from "../utils/logger";

export interface CreateProjectDTO {
    name: string
}

export interface GetProjectDTO {
    projectId: string
}

export interface AddUserToProjectDTO {
    projectId: string
    requestUser: User
    userId: string
}

export interface RemoveUserOfProjectDTO {
    projectId: string
    requestUser: User
    userId: string
}

export interface DeleteProjectDTO {
    projectId: string
    userId: string
}

export interface IProjectUseCases {
    createProject: (projectData: CreateProjectDTO, user: User) => Promise<Project>
    getProject: (projectData: GetProjectDTO) => Promise<Project>
    addUserToProject: (projectData: AddUserToProjectDTO) => Promise<Project>
    deleteProject: (projectData: DeleteProjectDTO) => Promise<void>
}

export class ProjectUseCases implements IProjectUseCases {
    private userService: UserService
    private projectService: ProjectService

    constructor(userService: UserService, projectService: ProjectService) {
        this.userService = userService
        this.projectService = projectService
    }

    async createProject({ name }: CreateProjectDTO, user: User) {
        const project = new Project({
            id: "",
            name,
            createdAt: new Date(),
            updatedAt: new Date(),
            ownerId: user.id,
            users: [user.id]
        })

        const newProject = await this.projectService.create(project)
        logger.debug(`created new project in database. name: ${name}. id: ${newProject.id}`)

        user.addProject(newProject.id)
        try {
            await this.userService.update(user)
        } catch (err) {
            // if got an error to assign the project to the user, the project must be deleted
            await this.projectService.delete(newProject.id)
            throw err
        }
        logger.debug(`assign project name ${name} to user id ${user.id}`)

        return new Project(newProject)
    }

    async getProject({ projectId }: GetProjectDTO) {
        const project = await this.projectService.findById(projectId)

        return new Project(project)
    }

    async addUserToProject({ projectId, requestUser, userId }: AddUserToProjectDTO) {
        logger.debug(`adding user id ${userId} to project id ${projectId}`)
        const project = await this.projectService.findById(projectId)

        if (project.ownerId !== requestUser.id) {
            throw new CommonError("You cannot add new users to the project if you are not the owner", "Forbidden", 403)
        }

        logger.debug(`checking user id ${userId} to add in project id ${projectId}`)
        // will throw error if user does not exists
        const user = await this.userService.findById(userId)

        user.addProject(project.id)
        project.addUser(userId)

        logger.debug(`updating user id ${userId} and adding in project id ${projectId}`)
        await this.userService.update(user)
        const updatedProject = await this.projectService.update(project)

        logger.debug(`updated user id ${userId} and added in project id ${projectId}`)
        return updatedProject
    }

    async removeUserOfProject({ projectId, requestUser, userId }: RemoveUserOfProjectDTO) {
        logger.debug(`removing user id ${userId} of project id ${projectId}`)
        const project = await this.projectService.findById(projectId)

        if (project.ownerId !== requestUser.id) {
            throw new CommonError("You cannot remove users of the project if you are not the owner", "Forbidden", 403)
        }

        logger.debug(`checking user id ${userId} of project id ${projectId}`)
        // will throw error if user does not exists
        const user = await this.userService.findById(userId)

        user.removeProject(projectId)
        project.removeUser(userId)

        logger.debug(`updating user id ${userId} and removing of project id ${projectId}`)
        await this.userService.update(user)
        const updatedProject = await this.projectService.update(project)

        logger.debug(`updated user id ${userId} and removed of project id ${projectId}`)
        return updatedProject
    }

    async deleteProject({ projectId, userId }: DeleteProjectDTO) {
        const project = await this.projectService.findById(projectId)

        if (project.ownerId !== userId) {
            throw new CommonError("You cannot delete a project that you are not the owner", "Forbidden", 403)
        }

        logger.debug(`deleting project. id: ${projectId}`)
        const projectDeleted = await this.projectService.delete(projectId)

        logger.debug(`project deleted. deleting projectId from users. id: ${projectId}`)
        for (const userId of projectDeleted.users) {
            const user = await this.userService.findById(userId)
            user.removeProject(projectId)
            await this.userService.update(user)
        }

        logger.debug(`success deleted project. id: ${projectId}`)
    }
}
