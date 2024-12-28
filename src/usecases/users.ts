import { User } from "../entities/User";
import { SignedIn } from "../interfaces/auth";
import { UserService } from "../services/users";

export interface CreateUserDTO {
    email: string
    firstName: string
    lastName: string
    password: string
}

export interface AuthenticateUserDTO {
    email: string
    password: string
}

export interface IUserUseCases {
    createUser: (user: CreateUserDTO) => Promise<User>
    authenticateUser: (authData: AuthenticateUserDTO) => Promise<SignedIn>
}

export class UserUseCases implements UserUseCases {
    private userService: UserService

    constructor(userService: UserService) {
        this.userService = userService
    }

    async createUser({ email, firstName, lastName, password }: CreateUserDTO) {
        const user = new User({
            id: "",
            email,
            firstName,
            lastName,
            projects: []
        })

        const result = await this.userService.create(user, password)

        user.id = result.id
        return user
    }

    async authenticateUser({ email, password }: AuthenticateUserDTO) {
        const result = await this.userService.authenticate(email, password)

        return result
    }
}
