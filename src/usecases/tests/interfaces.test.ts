import { InterfaceUseCases, CreateInterfaceDTO, GetInterfaceDTO, UpdateInterfaceDTO, DeleteInterfaceDTO } from "../interfaces";
import { InterfaceService } from "../../services/interfaces";
import { Interface } from "../../entities/Interface";
import { CommonError } from "../../utils/commonError";
import { isValidPath } from "../../utils/getValueFromPath";

jest.mock("../../utils/logger", () => ({
    logger: {
        debug: jest.fn(),
    },
}));

jest.mock("../../utils/getValueFromPath", () => ({
    isValidPath: jest.fn(),
}));

jest.mock("../../utils/secretHash", () => ({
    generateHash: jest.fn().mockReturnValue({
        hash: "secret-hash",
        salt: "secret-salt",
    }),
}));

describe("InterfaceUseCases", () => {
    let mockInterfaceService: jest.Mocked<InterfaceService>;
    let interfaceUseCases: InterfaceUseCases;

    beforeEach(() => {
        mockInterfaceService = {
            create: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        } as unknown as jest.Mocked<InterfaceService>;

        interfaceUseCases = new InterfaceUseCases(mockInterfaceService);
    });

    describe("createInterface", () => {
        it("should create a new interface and return it", async () => {
            const dto: CreateInterfaceDTO = {
                name: "New Interface",
                eventEndpoint: "/events",
                controlEndpoint: "/control",
                control: "another-interface-id",
                externalIdField: "data.id",
            };
            const projectId = "project-123";

            const createdInterface = new Interface({
                id: "interface-123",
                ...dto,
                controlEndpoint: dto.controlEndpoint,
                control: dto.control,
                projectId,
                secretHash: "secret-hash",
                secretSalt: "secret-salt",
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            mockInterfaceService.create.mockImplementation(async (interfaceInst: Interface) => {
                interfaceInst.id = createdInterface.id
                interfaceInst.createdAt = createdInterface.createdAt
                interfaceInst.updatedAt = createdInterface.updatedAt
                return interfaceInst
            });

            const result = await interfaceUseCases.createInterface(dto, projectId);

            expect(mockInterfaceService.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    name: dto.name,
                    eventEndpoint: dto.eventEndpoint,
                    controlEndpoint: dto.controlEndpoint,
                    control: dto.control,
                    externalIdField: dto.externalIdField,
                    secretHash: "secret-hash",
                    secretSalt: "secret-salt",
                    projectId,
                })
            );
            expect(result.interface).toEqual(createdInterface);
            expect(result.secret).toBeDefined();
        });
    });

    describe("getInterface", () => {
        it("should return the requested interface", async () => {
            const dto: GetInterfaceDTO = { interfaceId: "interface-123" };
            const foundInterface = new Interface({
                id: "interface-123",
                name: "Existing Interface",
                eventEndpoint: "/existing",
                controlEndpoint: "",
                control: null,
                externalIdField: "data.id",
                projectId: "project-123",
                secretHash: "secret-hash",
                secretSalt: "secret-salt",
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            mockInterfaceService.findById.mockResolvedValue(foundInterface);

            const result = await interfaceUseCases.getInterface(dto);

            expect(mockInterfaceService.findById).toHaveBeenCalledWith(dto.interfaceId);
            expect(result).toEqual(foundInterface);
        });
    });

    describe("updateInterface", () => {
        let existingInterface: Interface;

        beforeEach(() => {
            existingInterface = new Interface({
                id: "interface-123",
                name: "Interface to update",
                eventEndpoint: "/old-events",
                controlEndpoint: "/old-control",
                control: null,
                externalIdField: "data.id",
                projectId: "project-123",
                secretHash: "secret-hash",
                secretSalt: "secret-salt",
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            mockInterfaceService.findById.mockResolvedValue(existingInterface);
        });

        it("should update the interface with valid data and return it", async () => {
            const dto: UpdateInterfaceDTO = {
                interfaceId: "interface-123",
                name: "Updated Interface",
                eventEndpoint: "/new-events",
                externalIdField: "data.newId",
            };

            // Mark path validation as successful
            (isValidPath as jest.Mock).mockReturnValue(true);

            const updatedInterface = new Interface({
                ...existingInterface,
                ...dto,
            });
            mockInterfaceService.update.mockResolvedValue(updatedInterface);

            const result = await interfaceUseCases.updateInterface(dto);

            expect(mockInterfaceService.findById).toHaveBeenCalledWith(dto.interfaceId);
            expect(isValidPath).toHaveBeenCalledWith(dto.externalIdField);
            expect(mockInterfaceService.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: "interface-123",
                    name: "Updated Interface",
                    eventEndpoint: "/new-events",
                    externalIdField: "data.newId",
                })
            );
            expect(result).toEqual(updatedInterface);
        });

        it("should throw a CommonError if the `control` interface does not exist", async () => {
            const dto: UpdateInterfaceDTO = {
                interfaceId: "interface-123",
                control: "missing-interface-id",
            };

            (isValidPath as jest.Mock).mockReturnValue(true);

            // Force `findById(control)` to fail
            mockInterfaceService.findById
                .mockResolvedValueOnce(existingInterface) // First call: the original interface
                .mockRejectedValueOnce(new Error("Not found")); // Second call: the control interface

            await expect(interfaceUseCases.updateInterface(dto)).rejects.toThrow(CommonError);

            // The second findById call is for the control interface
            expect(mockInterfaceService.findById).toHaveBeenCalledTimes(2);
        });

        it("should throw a CommonError if the new externalIdField is invalid", async () => {
            const dto: UpdateInterfaceDTO = {
                interfaceId: "interface-123",
                externalIdField: "invalid.path",
            };

            // Mark path validation as failed
            (isValidPath as jest.Mock).mockReturnValue(false);

            await expect(interfaceUseCases.updateInterface(dto)).rejects.toThrow(CommonError);
            expect(mockInterfaceService.update).not.toHaveBeenCalled();
        });
    });

    describe("deleteInterface", () => {
        it("should delete the interface without errors", async () => {
            const dto: DeleteInterfaceDTO = { interfaceId: "interface-123" };

            mockInterfaceService.delete.mockImplementation(async (interfaceId: string) => new Interface({
                id: interfaceId,
                name: "name",
                control: null,
                projectId: "project-id",
                eventEndpoint: "event-endpoint",
                controlEndpoint: "control-endpoint",
                externalIdField: "external-id-field",
                secretHash: "secret-hash",
                secretSalt: "secret-salt",
                createdAt: new Date(),
                updatedAt: new Date(),
            }));

            await expect(interfaceUseCases.deleteInterface(dto)).resolves.not.toThrow();
            expect(mockInterfaceService.delete).toHaveBeenCalledWith(dto.interfaceId);
        });
    });
});
