import axios, { AxiosInstance, isAxiosError } from "axios"
import http from "node:http"
import axiosRetry from "axios-retry"
import { logger } from "../../utils/logger"
import { RequestConfig, Http } from "../../interfaces/http"

export class Axios implements Http {
    private client: AxiosInstance

    constructor() {
        this.client = axios.create({
            timeout: 10000,
        })

        axiosRetry(this.client, {
            retries: 3,
            retryDelay: (retryCount) => {
                return retryCount * 2000
            },
            retryCondition: (error) => {
                return error.response && error.response.status >= 500 || !error.response
            },
        })
    }

    private handleError(error: any): Promise<any> {
        if (isAxiosError(error)) {
            const request: http.ClientRequest = error.request
            const sessionId = request.getHeader("catapio-session-id")

            logger.info(`HTTP Error. sessionId: ${sessionId}`)

            throw new Error(error.response?.statusText || "no response")
        }

        logger.error(error)
        throw new Error("Unexpected error. Contact support")
    }

    async get<T>(url: string, config?: RequestConfig): Promise<T | void> {
        try {
            const response = await this.client.get<T>(url, config)
            return response.data
        } catch (err) {
            this.handleError(err)
        }
    }

    async post<T>(url: string, data?: any, config?: RequestConfig): Promise<T | void> {
        try {
            const response = await this.client.post<T>(url, data, config)
            return response.data
        } catch (err) {
            this.handleError(err)
        }
    }

    async put<T>(url: string, data?: any, config?: RequestConfig): Promise<T | void> {
        try {
            const response = await this.client.put<T>(url, data, config)
            return response.data
        } catch (err) {
            this.handleError(err)
        }
    }

    async delete<T>(url: string, config?: RequestConfig): Promise<T | void> {
        try {
            const response = await this.client.delete<T>(url, config)
            return response.data
        } catch (err) {
            this.handleError(err)
        }
    }
}
