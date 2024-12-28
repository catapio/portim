import { User } from "../entities/User"

export interface SignedIn {
    tokenType: string
    accessToken: string
    refreshToken: string
    expiresIn: number
}

export interface Authorize {
    user: User
}

export interface Auth {
    signup: (user: User, password: string) => Promise<User>
    signin: (email: string, password: string) => Promise<SignedIn>
    authorize: (token: string) => Promise<Authorize>
    findUser: (userId: string) => Promise<User>
    updateUser: (user: User) => Promise<User>
}
