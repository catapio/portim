import { createClient } from "@supabase/supabase-js";
import { Auth } from "../../interfaces/auth";
import { CommonError } from "../../utils/commonError";

export class Supabase implements Auth {
    private client

    constructor(url: string, key: string) {
        this.client = createClient(url, key)
    }

    async signup(email: string, firstName: string, lastName: string, password: string) {
        const result = await this.client.auth.signUp({
            email,
            password,
            options: {
                data: {
                    firstName,
                    lastName,
                }
            }
        })

        if (result.error) {
            throw new CommonError(result.error.message)
        }

        if (!result.data.user) {
            throw new CommonError("User not created due an unexpected error. Contact support or try again later", "Unexpected Error", 500)
        }

        return {
            id: result.data.user.id,
        }
    }

    async signin(email: string, password: string) {
        const result = await this.client.auth.signInWithPassword({
            email,
            password
        })

        if (result.error) {
            throw new CommonError(result.error.message)
        }

        if (!result.data.session) {
            throw new CommonError("User not logged in due an unexpected error. Contact support or try again later", "Unexpected Error", 500)
        }

        return {
            tokenType: result.data.session.token_type,
            accessToken: result.data.session.access_token,
            refreshToken: result.data.session.refresh_token,
            expiresIn: result.data.session.expires_in,
        }
    }

    async authorize(token: string) {
        const result = await this.client.auth.getUser(token)

        if (result.error) {
            throw new CommonError(result.error.message, "Unauthorized", 401)
        }

        return {
            user: {
                id: result.data.user.id,
                email: result.data.user.email,
                metadata: result.data.user.user_metadata
            }
        }
    }
}
