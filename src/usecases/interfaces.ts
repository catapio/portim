import { Interface } from "../entities/Interface";
import { InterfaceService } from "../services/interfaces";
import { CommonError } from "../utils/commonError";
import { isValidPath } from "../utils/getValueFromPath";
import { logger } from "../utils/logger";

export interface CreateInterfaceDTO {
    name: string
    eventEndpoint: string
    controlEndpoint: string
    control: string | null
    externalIdField: string
}

export interface GetInterfaceDTO {
    interfaceId: string
}

export interface UpdateInterfaceDTO {
    interfaceId: string
    name?: string
    eventEndpoint?: string
    controlEndpoint?: string
    control?: string
    externalIdField?: string
}

export interface DeleteInterfaceDTO {
    interfaceId: string
}

export interface IInterfaceUseCases {
    createInterface: (interfaceData: CreateInterfaceDTO, projectId: string) => Promise<Interface>
    getInterface: (interfaceData: GetInterfaceDTO) => Promise<Interface>
    updateInterface: (interfaceData: UpdateInterfaceDTO) => Promise<Interface>
    deleteInterface: (interfaceData: DeleteInterfaceDTO) => Promise<void>
}

export class InterfaceUseCases implements IInterfaceUseCases {
    private interfaceService: InterfaceService

    constructor(interfaceService: InterfaceService) {
        this.interfaceService = interfaceService
    }

    async createInterface({ name, eventEndpoint, controlEndpoint, externalIdField, control }: CreateInterfaceDTO, projectId: string) {
        const interfaceInst = new Interface({
            id: "",
            name,
            eventEndpoint,
            controlEndpoint: controlEndpoint || "",
            control: control || null,
            externalIdField,
            projectId,
            createdAt: new Date(),
            updatedAt: new Date(),
        })

        const newInterface = await this.interfaceService.create(interfaceInst)
        logger.debug(`created new interface in database. name: ${name}.id: ${newInterface.id} in project id: ${projectId} `)

        return newInterface
    }

    async getInterface({ interfaceId }: GetInterfaceDTO) {
        const interfaceInst = await this.interfaceService.findById(interfaceId)

        return interfaceInst
    }

    async updateInterface({ interfaceId, name, eventEndpoint, controlEndpoint, externalIdField, control }: UpdateInterfaceDTO) {
        logger.debug(`update interface id ${interfaceId} `)
        const interfaceInst = await this.interfaceService.findById(interfaceId)
        if (control) {
            try {
                await this.interfaceService.findById(control)
            } catch (err: any) {
                logger.debug(`error searching for control interface ${err.message} `)
                throw new CommonError(`Not found control interface with id: ${control} `)
            }
        }

        interfaceInst.name = name || interfaceInst.name
        interfaceInst.eventEndpoint = eventEndpoint || interfaceInst.eventEndpoint
        interfaceInst.controlEndpoint = controlEndpoint || interfaceInst.controlEndpoint
        interfaceInst.externalIdField = externalIdField || interfaceInst.externalIdField
        interfaceInst.control = control || interfaceInst.control

        if (!isValidPath(interfaceInst.externalIdField)) throw new CommonError("ExternalId path is invalid")

        const interfaceUpdated = await this.interfaceService.update(interfaceInst)

        logger.debug(`updated interface id ${interfaceId} `)
        return interfaceUpdated
    }

    async deleteInterface({ interfaceId }: DeleteInterfaceDTO) {
        logger.debug(`deleting interface.id: ${interfaceId} `)
        await this.interfaceService.delete(interfaceId)

        logger.debug(`success deleted interface.id: ${interfaceId} `)
    }
}
