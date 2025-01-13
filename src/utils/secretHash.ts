import crypto from "node:crypto"

export function generateHash(secret: string, preGeneratedSalt?: string): { hash: string; salt: string } {
    const salt = preGeneratedSalt || crypto.randomBytes(36).toString("hex")
    const hash = crypto
        .createHmac("sha256", salt)
        .update(secret)
        .digest("hex")

    return { hash, salt }
}

export function validateSecret(secret: string, hash: string, salt: string): boolean {
    const candidateHash = generateHash(secret, salt)
    return hash === candidateHash.hash
}
