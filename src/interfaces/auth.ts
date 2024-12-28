export interface SignedUp {
    id: string
}

export interface SignedIn {
    tokenType: string
    accessToken: string
    refreshToken: string
    expiresIn: number
}

export interface AuthUser {
    id: string
    email?: string
    metadata: {
        firstName: string
        lastName: string
        projects?: string[]
    }
}

export interface Authorize {
    user: AuthUser
}

export interface Auth {
    signup: (email: string, firstName: string, lastName: string, password: string) => Promise<SignedUp>
    signin: (email: string, password: string) => Promise<SignedIn>
    authorize: (token: string) => Promise<Authorize>
    findUser: (userId: string) => Promise<AuthUser>
    updateUser: (userId: string, metadata: Record<string, any>) => Promise<SignedUp>
}
