export interface Encrypted {
    encryptedData: string
    iv: string
}

export interface Encryption {
    encrypt: (data: string) => Encrypted
    decrypt: (encryptedData: string, iv: string) => string
}
