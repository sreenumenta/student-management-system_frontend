// const API_BASE_URL = import.meta.env.DEV
//   ? ''
//   : (import.meta.env.VITE_API_BASE_URL || 'https://student-management-system-wvmf.onrender.com').replace(/\/+$/, '')


const API_BASE_URL = import.meta.env.DEV
  ? 'http://127.0.0.1:8000'
  : (
    console.log("ul: ",VITE_API_BASE_URL)
      import.meta.env.VITE_API_BASE_URL ||
      'https://student-management-system-wvmf.onrender.com'
    ).replace(/\/+$/, '')

const ENDPOINTS = {
  students: '/api/students/',
  teachers: '/api/teachers/',
  courses: '/api/courses/',
}




function getEndpoint(resource, id) {
  const collection = ENDPOINTS[resource]
  if (!collection) throw new Error(`Unknown API resource: ${resource}`)
  return id === undefined ? collection : `${collection}${encodeURIComponent(id)}/`
}

function getErrorMessage(body, status) {
  if (typeof body === 'string' && body.trim()) return body
  if (body && typeof body === 'object') {
    if (typeof body.detail === 'string') return body.detail
    const messages = Object.entries(body)
      .flatMap(([field, errors]) => {
        const values = Array.isArray(errors) ? errors : [errors]
        return values.filter((error) => typeof error === 'string').map((error) => (
          field === 'non_field_errors' ? error : `${field}: ${error}`
        ))
      })
    if (messages.length) return messages.join(' ')
  }
  return `Request failed (${status}). Please try again.`
}

function createApiError(message, status, allowedMethods) {
  const error = new Error(message)
  error.status = status
  error.allowedMethods = allowedMethods
  return error
}

async function request(resource, { id, method = 'GET', data } = {}) {
  let response
  try {
    response = await fetch(`${API_BASE_URL}${getEndpoint(resource, id)}`, {
      method,
      headers: {
        Accept: 'application/json',
        ...(data === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      ...(data === undefined ? {} : { body: JSON.stringify(data) }),
    })
  } catch {
    throw new Error('Could not reach the API. In production, the API must allow this frontend origin with CORS; for local development, use the Vite dev server.')
  }

  const responseText = response.status === 204 ? '' : await response.text()
  let body
  if (responseText) {
    try {
      body = JSON.parse(responseText)
    } catch {
      body = responseText
    }
  }
  if (!response.ok) {
    throw createApiError(
      getErrorMessage(body, response.status),
      response.status,
      response.headers.get('allow')?.split(',').map((method) => method.trim()) || [],
    )
  }
  return body
}

export async function getRecords(resource) {
  const body = await request(resource)
  const records = Array.isArray(body) ? body : body?.results
  if (!Array.isArray(records)) throw new Error(`The ${resource} response did not contain a record list.`)
  return records
}

export async function getRecord(resource, id) {
  return request(resource, { id })
}

export async function createRecord(resource, data) {
  return request(resource, { method: 'POST', data })
}

export async function replaceRecord(resource, id, data) {
  return request(resource, { id, method: 'PUT', data })
}

export async function patchRecord(resource, id, data) {
  return request(resource, { id, method: 'PATCH', data })
}

export async function deleteRecord(resource, id) {
  await request(resource, { id, method: 'DELETE' })
}
