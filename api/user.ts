import axios from '@/lib/axios'
import useSWR from 'swr'

export interface User {
  _id: string
  username: string
  imageUrl: string
  emailAddress: string
  created_at: string
}

export const githubLogin = async (code: string) => {
  const res = await axios.get(`/api/github-auth?code=${code}`)
  return res.data
}

export const getUserInfo = () => {
  return axios.get('/api/user/get-info')
}

export const getUserInfoByEmail = (email: string) => {
  return axios.get(`/api/user/get-info-by-email?email=${email}`)
}

const fetcher = (url: string) => axios.get(url).then((res) => res.data)

export const useUserInfoByEmail = (email: string) => {
  const { data, isLoading } = useSWR<User>(
    `/api/user/get-info-by-email?email=${email}`,
    fetcher
  )

  return {
    userInfo: data,
    isLoading,
  }
}
