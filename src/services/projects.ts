import { Project } from "../entities/Project";

export interface IProjectService {
    create: (project: Project) => Promise<Project>
}

export class ProjectService implements IProjectService {
    /**
    * Creates a project and may throw an error if creation fails.
    * @throws {Error} If the signup operation fails.
    */
    async create(project: Project) {
        return project
    }
}
