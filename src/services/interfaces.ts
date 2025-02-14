import { logger } from "../utils/logger";
import { CommonError } from "../utils/commonError";
import { PrismaClient } from "@prisma/client";
import { Interface } from "../entities/Interface";
import { Encryption } from "../interfaces/encryption";

export interface IInterfaceService {
    findById: (interfaceId: string) => Promise<Interface>
    create: (interfaceInst: Interface) => Promise<Interface>
    update: (interfaceInst: Interface) => Promise<Interface>
    delete: (interfaceId: string) => Promise<Interface>
}

export class InterfaceService implements IInterfaceService {
    private prisma: PrismaClient
    private encryption: Encryption

    constructor(prisma: PrismaClient, encryption: Encryption) {
        this.prisma = prisma
        this.encryption = encryption
    }

    /**
    * Find an interface by id and it may throw an error if fetch fails.
    * @throws {Error} If the search fails.
    */
    async findById(interfaceId: string) {
        logger.debug(`finding interface in database. id: ${interfaceId}`)
        const interfaceInst = await this.prisma.interface.findUnique({
            where: {
                id: interfaceId
            }
        })
        if (!interfaceInst) throw new CommonError("Interface does not exists")

        logger.debug(`found interface in database. id: ${interfaceInst.id}`)

        if (interfaceInst.secretToken && interfaceInst.ivToken) {
            const decryption = this.encryption.decrypt(interfaceInst.secretToken, interfaceInst.ivToken)

            interfaceInst.secretToken = decryption
        }

        return new Interface(interfaceInst)
    }

    /**
    * Creates an interface and it may throw an error if creation fails.
    * @throws {Error} If the creation fails.
    */
    async create(interfaceInst: Interface) {
        logger.debug("creating interface in database")

        const decryptedSecretToken = interfaceInst.secretToken
        if (interfaceInst.secretToken) {
            const encryption = this.encryption.encrypt(interfaceInst.secretToken)

            interfaceInst.secretToken = encryption.encryptedData
            interfaceInst.ivToken = encryption.iv
        }

        const newInterface = await this.prisma.interface.create({
            data: {
                name: interfaceInst.name,
                projectId: interfaceInst.projectId,
                control: interfaceInst.control,
                eventEndpoint: interfaceInst.eventEndpoint,
                controlEndpoint: interfaceInst.controlEndpoint,
                externalIdField: interfaceInst.externalIdField,
                secretHash: interfaceInst.secretHash,
                secretSalt: interfaceInst.secretSalt,
                secretToken: interfaceInst.secretToken,
                ivToken: interfaceInst.ivToken,
                allowedIps: interfaceInst.allowedIps
            }
        })
        logger.debug(`created interface in database. id: ${newInterface.id}`)

        newInterface.secretToken = decryptedSecretToken
        return new Interface(newInterface)
    }

    /**
    * Updates an interface and it may throw an error if update fails.
    * @throws {Error} If the update fails.
    */
    async update(interfaceInst: Interface) {
        const decryptedSecretToken = interfaceInst.secretToken
        if (interfaceInst.secretToken) {
            const encryption = this.encryption.encrypt(interfaceInst.secretToken)

            interfaceInst.secretToken = encryption.encryptedData
            interfaceInst.ivToken = encryption.iv
        }

        try {
            logger.debug(`updating interface in database. id: ${interfaceInst.id}`)
            const interfaceUpdated = await this.prisma.interface.update({
                where: {
                    id: interfaceInst.id
                },
                data: {
                    name: interfaceInst.name,
                    projectId: interfaceInst.projectId,
                    control: interfaceInst.control,
                    eventEndpoint: interfaceInst.eventEndpoint,
                    controlEndpoint: interfaceInst.controlEndpoint,
                    externalIdField: interfaceInst.externalIdField,
                    secretToken: interfaceInst.secretToken,
                    ivToken: interfaceInst.ivToken,
                }
            })
            logger.debug(`updated interface in database. id: ${interfaceUpdated.id}`)

            interfaceUpdated.secretToken = decryptedSecretToken
            return new Interface(interfaceUpdated)
        } catch (err) {
            logger.error(err)
            throw new CommonError("Not found interface to update")
        }
    }

    /**
    * Deletes an interface and it may throw an error if deletion fails.
    * @throws {Error} If the deletion fails.
    */
    async delete(interfaceId: string) {
        try {

            logger.debug(`deleting interface in database. id: ${interfaceId}`)
            const interfaceDeleted = await this.prisma.interface.delete({
                where: {
                    id: interfaceId
                }
            })
            logger.debug(`deleted interface in database. id: ${interfaceDeleted.id}`)

            return new Interface(interfaceDeleted)
        } catch (err) {
            logger.error(err)
            throw new CommonError("Not found interface to delete")
        }
    }
}
