import { Encryption } from "../../interfaces/encryption";
import crypto from "node:crypto"

export class NodeCrypto implements Encryption {
    private readonly ivLength = 16
    private readonly encryptionAlgorithm = "aes-256-cbc"
    private readonly secretKey = process.env.SECRET_ENCRYPTION_KEY

    encrypt(data: string) {
        if (!this.secretKey) throw new Error("scretKey is not defined")

        const iv = crypto.randomBytes(this.ivLength)

        const cipher = crypto.createCipheriv(this.encryptionAlgorithm, this.secretKey, iv)

        let encrypted = cipher.update(data, "utf8", "hex")

        encrypted += cipher.final("hex")

        return {
            encryptedData: encrypted,
            iv: iv.toString("hex"),
        }
    }

    decrypt(encryptedData: string, iv: string) {
        if (!this.secretKey) throw new Error("secretKey is not defined")

        const decipher = crypto.createDecipheriv(
            this.encryptionAlgorithm,
            this.secretKey,
            Buffer.from(iv, "hex")
        )

        let decrypted = decipher.update(encryptedData, "hex", "utf8")
        decrypted += decipher.final("utf8")

        return decrypted
    }
}
