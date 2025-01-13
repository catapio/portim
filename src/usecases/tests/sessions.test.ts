import { SessionUseCases, CreateSessionDTO, GetSessionDTO, UpdateSessionDTO, DeleteSessionDTO } from "../sessions";
import { SessionService } from "../../services/sessions";
import { InterfaceService } from "../../services/interfaces";
import { Session } from "../../entities/Session";
import { Interface } from "../../entities/Interface";
import { CommonError } from "../../utils/commonError";
import { Http } from "src/interfaces/http";

jest.mock("../../utils/logger", () => ({
    logger: {
        debug: jest.fn(),
    },
}));

describe("SessionUseCases", () => {
    let mockSessionService: jest.Mocked<SessionService>;
    let mockInterfaceService: jest.Mocked<InterfaceService>;
    let sessionUseCases: SessionUseCases;
    let mockHttp: jest.Mocked<Http>;

    beforeEach(() => {
        mockSessionService = {
            create: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        } as unknown as jest.Mocked<SessionService>;

        mockInterfaceService = {
            create: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        } as unknown as jest.Mocked<InterfaceService>;

        mockHttp = {
            get: jest.fn(),
            post: jest.fn(),
            put: jest.fn(),
            delete: jest.fn(),
        } as unknown as jest.Mocked<Http>;

        sessionUseCases = new SessionUseCases(mockSessionService, mockInterfaceService, mockHttp);
    });

    describe("createSession", () => {
        it("should create a new session with the interface's default control target when target is not provided", async () => {
            const dto: CreateSessionDTO = { clientId: "client-123" };
            const interfaceId = "interface-123";

            const interfaceInst = new Interface({
                id: interfaceId,
                name: "Interface with control",
                eventEndpoint: "/events",
                controlEndpoint: "/control",
                control: "control-interface-id",
                externalIdField: "data.id",
                projectId: "project-111",
                secretHash: "secret-hash",
                secretSalt: "secret-salt",
                secretToken: "secret-token",
                ivToken: "iv-token",
                createdAt: new Date(),
                updatedAt: new Date(),
                allowedIps: []
            });

            mockInterfaceService.findById.mockResolvedValue(interfaceInst);

            const createdSession = new Session({
                id: "session-123",
                source: interfaceId,
                clientId: dto.clientId,
                target: interfaceInst.control as string,
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            mockSessionService.create.mockResolvedValue(createdSession);

            const result = await sessionUseCases.createSession(dto, interfaceId);

            expect(mockInterfaceService.findById).toHaveBeenCalledWith(interfaceId);
            expect(mockSessionService.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    source: interfaceId,
                    clientId: dto.clientId,
                    target: interfaceInst.control,
                })
            );
            expect(result).toEqual(createdSession);
        });

        it("should throw a CommonError if the interface has no control when no target is provided", async () => {
            const dto: CreateSessionDTO = { clientId: "client-123" };
            const interfaceId = "interface-no-control";

            const interfaceWithoutControl = new Interface({
                id: interfaceId,
                name: "Interface without control",
                eventEndpoint: "/events",
                controlEndpoint: "",
                control: "",
                externalIdField: "data.id",
                projectId: "project-111",
                secretHash: "secret-hash",
                secretSalt: "secret-salt",
                secretToken: "secret-token",
                ivToken: "iv-token",
                createdAt: new Date(),
                updatedAt: new Date(),
                allowedIps: [],
            });

            mockInterfaceService.findById.mockResolvedValue(interfaceWithoutControl);

            await expect(sessionUseCases.createSession(dto, interfaceId)).rejects.toThrow(CommonError);
            expect(mockSessionService.create).not.toHaveBeenCalled();
        });
    });

    describe("getSession", () => {
        it("should return the requested session by ID", async () => {
            const dto: GetSessionDTO = { sessionId: "session-123" };
            const sessionInst = new Session({
                id: "session-123",
                source: "interface-123",
                clientId: "client-123",
                target: "target-123",
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            mockSessionService.findById.mockResolvedValue(sessionInst);

            const result = await sessionUseCases.getSession(dto);

            expect(mockSessionService.findById).toHaveBeenCalledWith(dto.sessionId);
            expect(result).toEqual(sessionInst);
        });
    });

    describe("updateSession", () => {
        it("should update the session target and return the updated session", async () => {
            const dto: UpdateSessionDTO = {
                sessionId: "session-987",
                target: "new-target",
                metadata: { someKey: "someValue" },
            };

            const interfaceInst = new Interface({
                id: "interface-123",
                name: "Interface with control",
                eventEndpoint: "/events",
                controlEndpoint: "/control",
                control: "control-interface-id",
                externalIdField: "data.id",
                projectId: "project-111",
                secretHash: "secret-hash",
                secretSalt: "secret-salt",
                secretToken: "secret-token",
                ivToken: "iv-token",
                createdAt: new Date(),
                updatedAt: new Date(),
                allowedIps: []
            });

            mockInterfaceService.findById.mockResolvedValue(interfaceInst);

            const existingSession = new Session({
                id: "session-987",
                source: "interface-xyz",
                clientId: "client-xyz",
                target: "old-target",
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            mockSessionService.findById.mockResolvedValue(existingSession);

            const updatedSession = new Session({
                ...existingSession,
                target: dto.target,
            });
            mockSessionService.update.mockResolvedValue(updatedSession);

            const result = await sessionUseCases.updateSession(dto);

            expect(mockSessionService.findById).toHaveBeenCalledWith(dto.sessionId);
            expect(mockHttp.post).toHaveBeenCalled()
            expect(mockSessionService.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: existingSession.id,
                    target: "new-target",
                })
            );
            // The `metadata` usage is not currently implemented, 
            // but you could test it if you add logic around metadata in your code
            expect(result).toEqual(updatedSession);
        });

        it("should return the existing session if the new target is empty or whitespace", async () => {
            const dto: UpdateSessionDTO = {
                sessionId: "session-444",
                target: "   ", // whitespace
            };

            const existingSession = new Session({
                id: "session-444",
                source: "interface-444",
                clientId: "client-444",
                target: "old-target",
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            mockSessionService.findById.mockResolvedValue(existingSession);

            const result = await sessionUseCases.updateSession(dto);

            // Because target is whitespace, we do not update the session
            expect(mockSessionService.update).not.toHaveBeenCalled();
            expect(result).toBe(existingSession);
        });
    });

    describe("deleteSession", () => {
        it("should delete the session", async () => {
            const dto: DeleteSessionDTO = { sessionId: "session-999" };

            mockSessionService.delete.mockResolvedValue(new Session({
                id: dto.sessionId,
                source: "source",
                target: "target",
                clientId: "client-id",
                updatedAt: new Date(),
                createdAt: new Date(),
            }));

            await expect(sessionUseCases.deleteSession(dto)).resolves.not.toThrow();
            expect(mockSessionService.delete).toHaveBeenCalledWith(dto.sessionId);
        });
    });
});
