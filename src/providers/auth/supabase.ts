import { createClient } from "@supabase/supabase-js";
import { Auth } from "../../interfaces/auth";
import { CommonError } from "../../utils/commonError";
import { User } from "../../entities/User";

export class Supabase implements Auth {
    private client

    constructor(url: string, key: string) {
        this.client = createClient(url, key)
    }

    async signup(user: User, password: string) {
        const result = await this.client.auth.signUp({
            email: user.email,
            password,
            options: {
                data: {
                    firstName: user.firstName,
                    lastName: user.lastName,
                }
            }
        })

        if (result.error) {
            throw new CommonError(result.error.message)
        }

        if (!result.data.user) {
            throw new CommonError("User not created due an unexpected error. Contact support or try again later", "Unexpected Error", 500)
        }

        user.id = result.data.user.id

        return user
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
            user: new User({
                id: result.data.user.id,
                email: result.data.user.email || "",
                firstName: result.data.user.user_metadata.firstName,
                lastName: result.data.user.user_metadata.lastName,
                projects: result.data.user.user_metadata.projects || []
            })
        }
    }

    async findUser(userId: string) {
        const result = await this.client.auth.admin.getUserById(userId)

        if (result.error) {
            throw new CommonError("Not found any user with given id")
        }

        return new User({
            id: result.data.user.id,
            email: result.data.user.email || "",
            firstName: result.data.user.user_metadata.firstName,
            lastName: result.data.user.user_metadata.lastName,
            projects: result.data.user.user_metadata.projects || []
        })
    }

    async updateUser(user: User) {
        const result = await this.client.auth.admin.updateUserById(user.id, {
            user_metadata: {
                firstName: user.firstName,
                lastName: user.lastName,
                projects: user.projects
            }
        })

        if (result.error) {
            throw new CommonError(result.error.message)
        }

        return new User({
            id: result.data.user.id,
            email: result.data.user.email || "",
            firstName: result.data.user.user_metadata.firstName,
            lastName: result.data.user.user_metadata.lastName,
            projects: result.data.user.user_metadata.projects
        })
    }
}
