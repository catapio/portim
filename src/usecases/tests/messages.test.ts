import { MessageUseCases, CreateMessageDTO, GetMessageDTO, UpdateMessageDTO, DeleteMessageDTO } from "../messages";
import { MessageService } from "../../services/messages";
import { SessionService } from "../../services/sessions";
import { ClientService } from "../../services/clients";
import { InterfaceService } from "../../services/interfaces";
import { Message } from "../../entities/Message";
import { Session } from "../../entities/Session";
import { Interface } from "../../entities/Interface";
import { Client } from "../../entities/Client";
import { CommonError } from "../../utils/commonError";
import { getValueFromPath } from "../../utils/getValueFromPath";
import { logger } from "../../utils/logger";

jest.mock("../../utils/logger", () => ({
    logger: {
        debug: jest.fn(),
        info: jest.fn(),
    },
}));

jest.mock("../../utils/getValueFromPath", () => ({
    getValueFromPath: jest.fn(),
}));

describe("MessageUseCases", () => {
    let mockMessageService: jest.Mocked<MessageService>;
    let mockSessionService: jest.Mocked<SessionService>;
    let mockClientService: jest.Mocked<ClientService>;
    let mockInterfaceService: jest.Mocked<InterfaceService>;
    let messageUseCases: MessageUseCases;

    beforeEach(() => {
        mockMessageService = {
            create: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        } as unknown as jest.Mocked<MessageService>;

        mockSessionService = {
            create: jest.fn(),
            findById: jest.fn(),
            findBySource: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        } as unknown as jest.Mocked<SessionService>;

        mockClientService = {
            create: jest.fn(),
            findByExternalId: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        } as unknown as jest.Mocked<ClientService>;

        mockInterfaceService = {
            create: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        } as unknown as jest.Mocked<InterfaceService>;

        messageUseCases = new MessageUseCases(
            mockMessageService,
            mockSessionService,
            mockClientService,
            mockInterfaceService
        );

        jest.clearAllMocks();
    });

    describe("createMessage", () => {
        const projectId = "project-123";
        const interfaceId = "interface-123";

        const defaultInterface = new Interface({
            id: interfaceId,
            name: "My Interface",
            eventEndpoint: "/events",
            controlEndpoint: "/control",
            control: "control-interface-id",
            externalIdField: "data.id",
            projectId,
            secretHash: "secret-hash",
            secretSalt: "secret-salt",
            createdAt: new Date(),
            updatedAt: new Date(),
            allowedIps: [],
        });

        it("should create a message for an existing session if sessionId is provided", async () => {
            const sessionId = "session-abc";
            const dto: CreateMessageDTO = {
                sender: "interface-123",
                status: "pending",
                body: { foo: "bar" },
            };

            const existingSession = new Session({
                id: sessionId,
                source: interfaceId,
                clientId: "client-123",
                target: "control-interface-id",
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            mockSessionService.findById.mockResolvedValue(existingSession);

            const createdMessage = new Message({
                id: "message-999",
                sessionId: sessionId,
                status: "pending",
                sender: dto.sender,
                content: "sha256hash",
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            mockMessageService.create.mockResolvedValue(createdMessage);

            mockInterfaceService.findById.mockResolvedValue(defaultInterface);

            const result = await messageUseCases.createMessage(dto, projectId, interfaceId, sessionId);

            expect(mockSessionService.findById).toHaveBeenCalledWith(sessionId);
            expect(mockMessageService.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    sessionId: sessionId,
                    sender: dto.sender,
                    status: dto.status,
                })
            );
            expect(mockInterfaceService.findById).toHaveBeenCalledTimes(1); // We call once to log "call source" or "call target"
            expect(result).toBe(createdMessage);
        });

        it("should create a message and create a new session if sessionId is not provided", async () => {
            const dto: CreateMessageDTO = {
                sender: interfaceId,
                status: "pending",
                body: { foo: "bar" },
            };

            (getValueFromPath as jest.Mock).mockReturnValue("client-ext-id");
            mockInterfaceService.findById.mockResolvedValue(defaultInterface);

            // If client doesn't exist, we create a new one
            const notFoundError = new Error("Client not found");
            mockClientService.findByExternalId.mockRejectedValue(notFoundError);

            const newClient = new Client({
                id: "client-999",
                externalId: "client-ext-id",
                projectId,
                metadata: {},
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            mockClientService.create.mockResolvedValue(newClient);

            // If session not found by source/client, we create a new session
            const notFoundSession = new Error("Session not found");
            mockSessionService.findBySource.mockRejectedValue(notFoundSession);

            const newSession = new Session({
                id: "session-new",
                source: interfaceId,
                target: defaultInterface.control as string,
                clientId: newClient.id,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            mockSessionService.create.mockResolvedValue(newSession);

            // Finally, we create the message
            const createdMessage = new Message({
                id: "message-new",
                sessionId: newSession.id,
                status: dto.status,
                sender: dto.sender,
                content: "sha256-hash-value",
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            mockMessageService.create.mockResolvedValue(createdMessage);

            mockInterfaceService.findById.mockResolvedValue(defaultInterface);

            const result = await messageUseCases.createMessage(dto, projectId, interfaceId);

            expect(getValueFromPath).toHaveBeenCalledWith(dto.body, defaultInterface.externalIdField);
            expect(mockClientService.findByExternalId).toHaveBeenCalledWith("client-ext-id");
            expect(mockClientService.create).toHaveBeenCalled(); // Because findByExternalId was rejected
            expect(mockSessionService.findBySource).toHaveBeenCalledWith(interfaceId, newClient.id);
            expect(mockSessionService.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    source: interfaceId,
                    target: defaultInterface.control,
                    clientId: newClient.id,
                })
            );
            expect(mockMessageService.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    sessionId: newSession.id,
                    sender: dto.sender,
                    status: dto.status,
                })
            );
            expect(result).toEqual(createdMessage);
        });

        it("should throw CommonError if the interface has no control and no sessionId is provided", async () => {
            const dto: CreateMessageDTO = {
                sender: interfaceId,
                status: "pending",
                body: {},
            };

            const interfaceNoControl = new Interface({
                ...defaultInterface,
                control: "",
            });
            mockInterfaceService.findById.mockResolvedValue(interfaceNoControl);

            await expect(
                messageUseCases.createMessage(dto, projectId, interfaceId)
            ).rejects.toThrowError(CommonError);

            expect(mockMessageService.create).not.toHaveBeenCalled();
        });

        it("should throw CommonError if the externalId is not found", async () => {
            const dto: CreateMessageDTO = {
                sender: interfaceId,
                status: "RECEIVED",
                body: {},
            };

            mockInterfaceService.findById.mockResolvedValue(defaultInterface);
            (getValueFromPath as jest.Mock).mockReturnValue(null); // simulate no external id found

            await expect(
                messageUseCases.createMessage(dto, projectId, interfaceId)
            ).rejects.toThrowError(CommonError);

            expect(mockClientService.findByExternalId).not.toHaveBeenCalled();
            expect(mockMessageService.create).not.toHaveBeenCalled();
        });

        it("should call the target endpoint if session.source is the sender, otherwise call the source endpoint", async () => {
            const sessionId = "session-abc";
            const dto: CreateMessageDTO = {
                sender: "some-other-interface",
                status: "pending",
                body: { foo: "bar" },
            };

            // Session's source is "interface-123", different from "some-other-interface"
            const existingSession = new Session({
                id: sessionId,
                source: interfaceId,
                clientId: "client-123",
                target: "control-interface-id",
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            mockSessionService.findById.mockResolvedValue(existingSession);

            const createdMessage = new Message({
                id: "message-999",
                sessionId,
                status: "pending",
                sender: dto.sender,
                content: "sha256hash",
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            mockMessageService.create.mockResolvedValue(createdMessage);

            // The session.source != sender => we call the source interface endpoint
            const interfaceSource = new Interface({
                ...defaultInterface,
                id: interfaceId, // same ID as session.source
            });
            mockInterfaceService.findById.mockResolvedValue(interfaceSource);

            await messageUseCases.createMessage(dto, projectId, interfaceId, sessionId);

            // Because session.source !== sender => calling source endpoint
            expect(mockInterfaceService.findById).toHaveBeenCalledWith(interfaceId);
            expect(logger.info).toHaveBeenCalledWith(`call source endpoint ${interfaceSource.eventEndpoint}`);
        });
    });

    describe("getMessage", () => {
        it("should retrieve a message by id", async () => {
            const dto: GetMessageDTO = { messageId: "message-111" };
            const existingMessage = new Message({
                id: "message-111",
                sessionId: "session-abc",
                status: "pending",
                sender: "interface-xyz",
                content: "hashed-content",
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            mockMessageService.findById.mockResolvedValue(existingMessage);

            const result = await messageUseCases.getMessage(dto);

            expect(mockMessageService.findById).toHaveBeenCalledWith("message-111");
            expect(result).toEqual(existingMessage);
        });
    });

    describe("updateMessage", () => {
        it("should update a message status and return the updated message", async () => {
            const dto: UpdateMessageDTO = {
                messageId: "message-222",
                status: "delivered",
            };

            const existingMessage = new Message({
                id: "message-222",
                sessionId: "session-abc",
                status: "pending",
                sender: "interface-xyz",
                content: "somehash",
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            mockMessageService.findById.mockResolvedValue(existingMessage);

            const updatedMessage = new Message({
                ...existingMessage,
                status: dto.status,
            });
            mockMessageService.update.mockResolvedValue(updatedMessage);

            const result = await messageUseCases.updateMessage(dto);

            expect(mockMessageService.findById).toHaveBeenCalledWith(dto.messageId);
            expect(mockMessageService.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: "message-222",
                    status: "delivered",
                })
            );
            expect(result).toEqual(updatedMessage);
        });
    });

    describe("deleteMessage", () => {
        it("should delete a message by id", async () => {
            const dto: DeleteMessageDTO = { messageId: "message-333" };

            mockMessageService.delete.mockResolvedValue(new Message({
                id: dto.messageId,
                sender: "sender",
                status: "pending",
                content: "content",
                sessionId: "sessionId",
                createdAt: new Date(),
                updatedAt: new Date()
            }));

            await expect(messageUseCases.deleteMessage(dto)).resolves.not.toThrow();
            expect(mockMessageService.delete).toHaveBeenCalledWith("message-333");
        });
    });
});
