import { UserUseCases, CreateUserDTO, AuthenticateUserDTO } from "../users";
import { UserService } from "../../services/users";
import { User } from "../../entities/User";
import { SignedIn } from "../../interfaces/auth";

jest.mock("../../services/users");

jest.mock("../../utils/logger", () => ({
    logger: {
        debug: jest.fn()
    }
}))

describe("UserUseCases", () => {
    let mockAuth: jest.Mocked<{
        signup: jest.Mock;
        signin: jest.Mock;
        authorize: jest.Mock;
        findUser: jest.Mock;
        updateUser: jest.Mock;
    }>;
    let mockUserService: jest.Mocked<UserService>;
    let userUseCases: UserUseCases;

    beforeEach(() => {
        mockAuth = {
            signup: jest.fn(),
            signin: jest.fn(),
            authorize: jest.fn(),
            findUser: jest.fn(),
            updateUser: jest.fn(),
        };

        mockUserService = new UserService(mockAuth) as jest.Mocked<UserService>;

        userUseCases = new UserUseCases(mockUserService);
    });

    describe("createUser", () => {
        it("should create a new user and return it", async () => {
            const dto: CreateUserDTO = {
                email: "test@example.com",
                firstName: "John",
                lastName: "Doe",
                password: "securePassword123",
            };

            const createdUserResult = new User({
                id: "user-id",
                email: "test@example.com",
                firstName: "John",
                lastName: "Doe",
                projects: [],
            });
            mockUserService.create.mockResolvedValue(createdUserResult);

            const result = await userUseCases.createUser(dto);

            expect(mockUserService.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    email: dto.email,
                    firstName: dto.firstName,
                    lastName: dto.lastName,
                    projects: [],
                }),
                dto.password
            );

            expect(result).toBeInstanceOf(User);
            expect(result.id).toBe(createdUserResult.id);
            expect(result.email).toBe(dto.email);
            expect(result.firstName).toBe(dto.firstName);
            expect(result.lastName).toBe(dto.lastName);
        });
    });

    describe("authenticateUser", () => {
        it("should authenticate the user and return the signed-in result", async () => {
            const dto: AuthenticateUserDTO = {
                email: "auth@example.com",
                password: "authPassword123",
            };

            const signedInResult: SignedIn = {
                accessToken: "access-token",
                refreshToken: "refresh-token",
                tokenType: "Bearer",
                expiresIn: 3600
            };

            mockUserService.authenticate.mockResolvedValue(signedInResult);

            const result = await userUseCases.authenticateUser(dto);

            expect(mockUserService.authenticate).toHaveBeenCalledWith(dto.email, dto.password);
            expect(result).toEqual(signedInResult);
        });

        it("should throw if authentication fails", async () => {
            const dto: AuthenticateUserDTO = {
                email: "auth@example.com",
                password: "wrong-password",
            };

            const authError = new Error("Invalid credentials");
            mockUserService.authenticate.mockRejectedValue(authError);

            await expect(userUseCases.authenticateUser(dto)).rejects.toThrow("Invalid credentials");
            expect(mockUserService.authenticate).toHaveBeenCalledWith(dto.email, dto.password);
        });
    });
});
