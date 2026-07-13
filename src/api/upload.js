import http from '@/api'

export function uploadFile(file, dir) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('dir', dir)
  return http.post('/upload/file', formData)
}
