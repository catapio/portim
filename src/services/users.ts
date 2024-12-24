import { User } from "../entities/User";
import { Auth, SignedIn } from "../interfaces/auth";
import { logger } from "../utils/logger";

export interface UserCreated {
    id: string
}

export interface IUserService {
    create: (user: User, password: string) => Promise<UserCreated>
    authenticate: (email: string, password: string) => Promise<SignedIn>
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
}
