import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'

const request = axios.create({
  baseURL: '/',
  withCredentials: true,
  timeout: 60000,
})

// response interceptor
request.interceptors.response.use((response: AxiosResponse) => {
  return response.data
})

export function GET<T = any>(url: string, data?: { [key: string]: any }, config?: AxiosRequestConfig): Promise<T> {
  return request.get(url, {
    params: data,
    ...config,
  })
}

export function POST<T = any>(url: string, data?: { [key: string]: any }, config?: AxiosRequestConfig): Promise<T> {
  return request.post(url, data, config)
}

export function PUT<T = any>(url: string, data?: { [key: string]: any }, config?: AxiosRequestConfig): Promise<T> {
  return request.put(url, data, config)
}

export function DELETE<T = any>(url: string, data?: { [key: string]: any }, config?: AxiosRequestConfig): Promise<T> {
  return request.delete(url, {
    params: data,
    ...config,
  })
}
