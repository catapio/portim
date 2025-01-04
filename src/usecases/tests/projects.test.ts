import { ProjectUseCases, CreateProjectDTO, GetProjectDTO, AddUserToProjectDTO, RemoveUserOfProjectDTO, DeleteProjectDTO } from "../projects";
import { UserService } from "../../services/users";
import { ProjectService } from "../../services/projects";
import { Project } from "../../entities/Project";
import { User } from "../../entities/User";
import { CommonError } from "../../utils/commonError";

jest.mock("../../utils/logger", () => ({
    logger: {
        debug: jest.fn(),
    },
}));

describe("ProjectUseCases", () => {
    let mockUserService: jest.Mocked<UserService>;
    let mockProjectService: jest.Mocked<ProjectService>;
    let projectUseCases: ProjectUseCases;

    beforeEach(() => {
        mockUserService = {
            create: jest.fn(),
            update: jest.fn(),
            findById: jest.fn(),
            authenticate: jest.fn(),
        } as unknown as jest.Mocked<UserService>;

        mockProjectService = {
            findById: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        } as unknown as jest.Mocked<ProjectService>;

        projectUseCases = new ProjectUseCases(mockUserService, mockProjectService);
    });

    describe("createProject", () => {
        it("should create a project, update the user, and return the created project", async () => {
            const user = new User({
                id: "user-id",
                email: "test@example.com",
                firstName: "Test",
                lastName: "User",
                projects: [],
            });

            const createdProject = new Project({
                id: "project-id",
                name: "Sample Project",
                ownerId: user.id,
                users: [user.id],
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            mockProjectService.create.mockResolvedValue(createdProject);

            mockUserService.update.mockImplementation(async (user: User) => user);

            const dto: CreateProjectDTO = { name: "Sample Project" };

            const result = await projectUseCases.createProject(dto, user);

            expect(mockProjectService.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    name: dto.name,
                    ownerId: user.id,
                    users: [user.id],
                }),
            );
            expect(mockUserService.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: user.id,
                    projects: ["project-id"], // ensure the project was added to the user's projects
                }),
            );
            expect(result).toBeInstanceOf(Project);
            expect(result.id).toBe("project-id");
        });

        it("should delete the project if user update fails", async () => {
            const user = new User({
                id: "user-id",
                email: "test@example.com",
                firstName: "Test",
                lastName: "User",
                projects: [],
            });

            const createdProject = new Project({
                id: "project-id",
                name: "Fail Project",
                ownerId: user.id,
                users: [user.id],
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            mockProjectService.create.mockResolvedValue(createdProject);

            // Force an error in userService.update
            const updateError = new Error("Failed to update user");
            mockUserService.update.mockRejectedValue(updateError);

            const dto: CreateProjectDTO = { name: "Fail Project" };

            await expect(projectUseCases.createProject(dto, user)).rejects.toThrow(updateError);

            expect(mockProjectService.delete).toHaveBeenCalledWith("project-id");
        });
    });

    describe("getProject", () => {
        it("should return the found project as a new Project instance", async () => {
            const projectData = new Project({
                id: "project-id",
                name: "Existing Project",
                ownerId: "user-id",
                users: ["user-id"],
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            mockProjectService.findById.mockResolvedValue(projectData);

            const dto: GetProjectDTO = { projectId: "project-id" };
            const result = await projectUseCases.getProject(dto);

            expect(mockProjectService.findById).toHaveBeenCalledWith("project-id");
            expect(result).toBeInstanceOf(Project);
            expect(result.id).toBe("project-id");
        });
    });

    describe("addUserToProject", () => {
        it("should add a user to the project if the request user is the owner", async () => {
            const owner = new User({
                id: "owner-id",
                email: "owner@example.com",
                firstName: "Owner",
                lastName: "User",
                projects: [],
            });

            const project = new Project({
                id: "project-id",
                name: "Project with Owner",
                ownerId: owner.id,
                users: [owner.id],
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            const userToAdd = new User({
                id: "user-to-add-id",
                email: "newuser@example.com",
                firstName: "New",
                lastName: "User",
                projects: [],
            });

            mockProjectService.findById.mockResolvedValue(project);
            mockUserService.findById.mockResolvedValue(userToAdd);
            mockUserService.update.mockImplementation(async (user: User) => user);
            mockProjectService.update.mockImplementation(async (project: Project) => project);

            const dto: AddUserToProjectDTO = {
                projectId: project.id,
                requestUser: owner,
                userId: userToAdd.id,
            };

            const result = await projectUseCases.addUserToProject(dto);

            expect(mockProjectService.findById).toHaveBeenCalledWith(project.id);
            expect(mockUserService.findById).toHaveBeenCalledWith(userToAdd.id);
            expect(mockUserService.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: userToAdd.id,
                    projects: [project.id],
                })
            );
            expect(mockProjectService.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: project.id,
                    users: [owner.id, userToAdd.id],
                })
            );
            expect(result.users).toContain(userToAdd.id);
        });

        it("should throw a CommonError if the requester is not the owner", async () => {
            const notOwner = new User({
                id: "not-owner-id",
                email: "notowner@example.com",
                firstName: "Not",
                lastName: "Owner",
                projects: [],
            });

            const project = new Project({
                id: "project-id",
                name: "Project with Another Owner",
                ownerId: "actual-owner-id",
                users: ["actual-owner-id"],
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            mockProjectService.findById.mockResolvedValue(project);

            const dto: AddUserToProjectDTO = {
                projectId: project.id,
                requestUser: notOwner,
                userId: "someone-else-id",
            };

            await expect(projectUseCases.addUserToProject(dto)).rejects.toThrow(CommonError);
        });
    });

    describe("removeUserOfProject", () => {
        it("should remove a user from the project if the requester is the owner", async () => {
            const owner = new User({
                id: "owner-id",
                email: "owner@example.com",
                firstName: "Owner",
                lastName: "User",
                projects: ["project-id"],
            });

            const project = new Project({
                id: "project-id",
                name: "Project with Owner",
                ownerId: owner.id,
                users: [owner.id, "user-to-remove-id"],
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            const userToRemove = new User({
                id: "user-to-remove-id",
                email: "remove@example.com",
                firstName: "Remove",
                lastName: "User",
                projects: ["project-id"],
            });

            mockProjectService.findById.mockResolvedValue(project);
            mockUserService.findById.mockResolvedValue(userToRemove);
            mockUserService.update.mockImplementation(async (user: User) => user);
            mockProjectService.update.mockImplementation(async (project: Project) => project);

            const dto: RemoveUserOfProjectDTO = {
                projectId: project.id,
                requestUser: owner,
                userId: userToRemove.id,
            };

            const result = await projectUseCases.removeUserOfProject(dto);

            expect(mockProjectService.findById).toHaveBeenCalledWith(project.id);
            expect(mockUserService.findById).toHaveBeenCalledWith(userToRemove.id);
            expect(mockUserService.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: userToRemove.id,
                    projects: [],
                })
            );
            expect(mockProjectService.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: project.id,
                    users: [owner.id],
                })
            );
            expect(result.users).not.toContain(userToRemove.id);
        });

        it("should throw a CommonError if the requester is not the owner", async () => {
            const notOwner = new User({
                id: "not-owner-id",
                email: "notowner@example.com",
                firstName: "Not",
                lastName: "Owner",
                projects: [],
            });

            const project = new Project({
                id: "project-id",
                name: "Project with Another Owner",
                ownerId: "actual-owner-id",
                users: ["actual-owner-id"],
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            mockProjectService.findById.mockResolvedValue(project);

            const dto: RemoveUserOfProjectDTO = {
                projectId: project.id,
                requestUser: notOwner,
                userId: "anyone-id",
            };

            await expect(projectUseCases.removeUserOfProject(dto)).rejects.toThrow(CommonError);
        });
    });

    describe("deleteProject", () => {
        it("should delete the project if the user is the owner, and remove the project from all users", async () => {
            const project = new Project({
                id: "project-id",
                name: "To Be Deleted",
                ownerId: "owner-id",
                users: ["owner-id", "collab-id"],
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            const owner = new User({
                id: "owner-id",
                email: "owner@example.com",
                firstName: "Owner",
                lastName: "User",
                projects: ["project-id"],
            });

            const collaborator = new User({
                id: "collab-id",
                email: "collab@example.com",
                firstName: "Collab",
                lastName: "User",
                projects: ["project-id"],
            });

            mockProjectService.findById.mockResolvedValue(project);
            mockProjectService.delete.mockResolvedValue(project);
            mockUserService.findById
                .mockResolvedValueOnce(owner)       // first call => owner
                .mockResolvedValueOnce(collaborator); // second call => collaborator
            mockUserService.update.mockImplementation(async (user: User) => user);

            const dto: DeleteProjectDTO = {
                projectId: "project-id",
                userId: "owner-id",
            };

            await expect(projectUseCases.deleteProject(dto)).resolves.not.toThrow();

            expect(mockProjectService.findById).toHaveBeenCalledWith("project-id");
            expect(mockProjectService.delete).toHaveBeenCalledWith("project-id");
            // Check that each user had the project removed
            expect(mockUserService.findById).toHaveBeenCalledTimes(2);
            expect(mockUserService.update).toHaveBeenCalledTimes(2);
        });

        it("should throw CommonError if the user is not the owner", async () => {
            const project = new Project({
                id: "project-id",
                name: "Fake Ownership",
                ownerId: "actual-owner-id",
                users: ["actual-owner-id"],
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            mockProjectService.findById.mockResolvedValue(project);

            const dto: DeleteProjectDTO = {
                projectId: "project-id",
                userId: "not-owner-id",
            };

            await expect(projectUseCases.deleteProject(dto)).rejects.toThrow(CommonError);
            expect(mockProjectService.delete).not.toHaveBeenCalled();
        });
    });
});
