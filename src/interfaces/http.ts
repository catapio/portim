export interface RequestConfig<D = any> {
    headers?: Record<string, string | string[]>
    data?: D
    params?: any
}

export interface Http {
    get: <T>(url: string, config?: RequestConfig) => Promise<T | void>
    post: <T>(url: string, data?: any, config?: RequestConfig) => Promise<T | void>
    put: <T>(url: string, data?: any, config?: RequestConfig) => Promise<T | void>
    delete: <T>(url: string, config?: RequestConfig) => Promise<T | void>
}
