import { Project } from "../entities/Project";
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

export interface DeleteProjectDTO {
    projectId: string
    userId: string
}

export interface IProjectUseCases {
    createProject: (projectData: CreateProjectDTO, userId: string, userMetadata: Record<string, any>) => Promise<Project>
    getProject: (projectData: GetProjectDTO) => Promise<Project>
    deleteProject: (projectData: DeleteProjectDTO) => Promise<void>
}

export class ProjectUseCases implements IProjectUseCases {
    private userService: UserService
    private projectService: ProjectService

    constructor(userService: UserService, projectService: ProjectService) {
        this.userService = userService
        this.projectService = projectService
    }

    async createProject({ name }: CreateProjectDTO, userId: string, userMetadata: Record<string, any>) {
        const project = new Project({
            id: "",
            name,
            createdAt: new Date(),
            updatedAt: new Date(),
            ownerId: userId,
            users: [userId]
        })

        const newProject = await this.projectService.create(project)
        logger.debug(`created new project in database. name: ${name}. id: ${newProject.id}`)

        if (Array.isArray(userMetadata.projects) && userMetadata.projects.length) {
            userMetadata.projects.push(newProject.id)
        } else {
            userMetadata.projects = [newProject.id]
        }
        try {
            await this.userService.update(userId, userMetadata)
        } catch (err) {
            // if got an error to assign the project to the user, the project must be deleted
            await this.projectService.delete(newProject.id)
            throw err
        }
        logger.debug(`assign project name ${name} to user id ${userId}`)

        return new Project(newProject)
    }

    async getProject({ projectId }: GetProjectDTO) {
        const project = await this.projectService.findById(projectId)

        return new Project(project)
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
            await this.userService.update(user.id, { projects: user.projects?.filter((id) => id !== projectId) })
        }

        logger.debug(`success deleted project. id: ${projectId}`)
    }
}
