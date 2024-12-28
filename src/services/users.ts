import { User } from "../entities/User";
import { Auth, SignedIn } from "../interfaces/auth";
import { logger } from "../utils/logger";

export interface UserExecuted {
    id: string
}

export interface IUserService {
    create: (user: User, password: string) => Promise<User>
    authenticate: (email: string, password: string) => Promise<SignedIn>
    findById: (userId: string) => Promise<User>
    update: (user: User) => Promise<UserExecuted>
}

export class UserService implements IUserService {
    private auth: Auth

    constructor(auth: Auth) {
        this.auth = auth
    }

    /**
    * Creates a user and may throw an error if signup fails.
    * @throws {Error} If the signup operation fails.
    */
    async create(user: User, password: string) {
        logger.debug("signing up user")
        const newUser = await this.auth.signup(user, password)
        logger.debug(`signed up user. id: ${newUser.id}`)

        return newUser
    }

    /**
    * Authenticate a user and may throw an error if signup fails.
    * @throws {Error} If the signin operation fails.
    */
    async authenticate(email: string, password: string) {
        logger.debug("signing in user")
        const result = await this.auth.signin(email, password)
        logger.debug("signed in user")

        return result
    }

    /**
    * Find a user and may throw an error if find fails.
    * @throws {Error} If find fails.
    */
    async findById(userId: string) {
        logger.debug(`fiding user. id: ${userId}`)
        const user = await this.auth.findUser(userId)
        logger.debug(`found user. id: ${userId}`)

        return user
    }

    /**
    * Update a user and may throw an error if update fails.
    * @throws {Error} If update fails.
    */
    async update(user: User) {
        logger.debug(`updating user. id: ${user.id}`)
        const updatedUser = await this.auth.updateUser(user)
        logger.debug(`updated user. id: ${user.id}`)

        return updatedUser
    }
}
