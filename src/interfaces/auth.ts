export interface SignedUp {
    id: string
}

export interface SignedIn {
    tokenType: string
    accessToken: string
    refreshToken: string
    expiresIn: number
}

export interface Authorize {
    user: {
        id: string
        email?: string
        metadata: Record<string, any>
    }
}

export interface Auth {
    signup: (email: string, firstName: string, lastName: string, password: string) => Promise<SignedUp>
    signin: (email: string, password: string) => Promise<SignedIn>
    authorize: (token: string) => Promise<Authorize>
}
