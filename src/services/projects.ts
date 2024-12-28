import { PrismaClient } from "@prisma/client";
import { Project } from "../entities/Project";
import { logger } from "../utils/logger";
import { CommonError } from "../utils/commonError";

export interface ProjectExecuted {
    id: string
}

export interface IProjectService {
    findById: (projectId: string) => Promise<Project>
    create: (project: Project) => Promise<Project>
    update: (project: Project) => Promise<Project>
    delete: (projectId: string) => Promise<Project>
}

export class ProjectService implements IProjectService {
    private prisma: PrismaClient

    constructor(prisma: PrismaClient) {
        this.prisma = prisma
    }

    /**
    * Find a project by id and it may throw an error if fetch fails.
    * @throws {Error} If the creation fails.
    */
    async findById(projectId: string) {
        logger.debug(`finding project in database. id: ${projectId}`)
        const project = await this.prisma.project.findUnique({
            where: {
                id: projectId
            }
        })
        if (!project) throw new CommonError("Project does not exists")

        logger.debug(`found project in database. id: ${project.id}`)

        return new Project(project)
    }

    /**
    * Creates a project and it may throw an error if creation fails.
    * @throws {Error} If the creation fails.
    */
    async create(project: Project) {
        logger.debug("creating project in database")
        const newProject = await this.prisma.project.create({
            data: {
                name: project.name,
                ownerId: project.ownerId,
                users: project.users
            }
        })
        logger.debug(`created project in database. id: ${newProject.id}`)

        return new Project(newProject)
    }

    /**
    * Updates a project and it may throw an error if update fails.
    * @throws {Error} If the update fails.
    */
    async update(project: Project) {
        try {
            logger.debug(`updating project in database. id: ${project.id}`)
            const projectUpdated = await this.prisma.project.update({
                where: {
                    id: project.id
                },
                data: project
            })
            logger.debug(`updated project in database. id: ${projectUpdated.id}`)

            return new Project(projectUpdated)
        } catch (err) {
            logger.error(err)
            throw new CommonError("Not found project to update")
        }
    }

    /**
    * Deletes a project and it may throw an error if deletion fails.
    * @throws {Error} If the deletion fails.
    */
    async delete(projectId: string) {
        try {

            logger.debug(`deleting project in database. id: ${projectId}`)
            const projectDeleted = await this.prisma.project.delete({
                where: {
                    id: projectId
                }
            })
            logger.debug(`deleted project in database. id: ${projectDeleted.id}`)

            return new Project(projectDeleted)
        } catch (err) {
            logger.error(err)
            throw new CommonError("Not found project to delete")
        }
    }
}
