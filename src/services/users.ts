import { User } from "../entities/User";
import { Auth, SignedIn } from "../interfaces/auth";
import { logger } from "../utils/logger";

export interface UserExecuted {
    id: string
}

export interface IUserService {
    create: (user: User, password: string) => Promise<UserExecuted>
    authenticate: (email: string, password: string) => Promise<SignedIn>
    findById: (userId: string) => Promise<User>
    update: (userId: string, metadata: Record<string, any>) => Promise<UserExecuted>
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
        const result = await this.auth.signup(user.email, user.firstName, user.lastName, password)
        logger.debug(`signed up user. id: ${result.id}`)

        return {
            id: result.id,
        }
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
        const result = await this.auth.findUser(userId)
        logger.debug(`found user. id: ${userId}`)

        return new User({
            id: result.id,
            email: result.email as string,
            firstName: result.metadata.firstName,
            lastName: result.metadata.lastName,
            projects: result.metadata.projects,
        })
    }

    /**
    * Update a user and may throw an error if update fails.
    * @throws {Error} If update fails.
    */
    async update(userId: string, metadata: Record<string, any>) {
        logger.debug(`updating user. id: ${userId}`)
        const result = await this.auth.updateUser(userId, metadata)
        logger.debug(`updated user. id: ${userId}`)

        return result
    }
}
