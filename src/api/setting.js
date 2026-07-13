import http from '@/api'

export function getGroup(group) {
  return http.get('/setting/group', { params: { group } })
}

export function saveGroup(group, items) {
  return http.post('/setting/save', { group, items })
}
