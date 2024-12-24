export interface SignedUp {
    id: string
}

export interface SignedIn {
    tokenType: string
    accessToken: string
    refreshToken: string
    expiresIn: number
}

export interface Auth {
    signup: (email: string, firstName: string, lastName: string, password: string) => Promise<SignedUp>
    signin: (email: string, password: string) => Promise<SignedIn>
}
