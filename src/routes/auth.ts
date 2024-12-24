import z from "zod";
import { FastifyTypedInstance } from "../types";

export async function authRoutes(app: FastifyTypedInstance) {
    app.get("/auth", {
        schema: {
            tags: ["auth"],
            description: "Redirect of email verification",
            response: {
                201: z.string().describe("Valid redirect")
            }
        }
    }, async (_, reply) => {
        reply.status(200).send("email verified")
    })
}
