// Replace these functions with API calls later. Keep the same names and return values.
const STORAGE_KEY = 'sakura-students'
const delay = () => new Promise((resolve) => window.setTimeout(resolve, 220))

export const COURSES = ['Computer Science', 'Business', 'Design', 'Engineering', 'Psychology']

const sampleStudents = [
  { id: 'stu-1001', firstName: 'Aarav', lastName: 'Sharma', email: 'aarav.sharma@example.com', phone: '9876543210', course: 'Computer Science', year: 2, status: 'Active' },
  { id: 'stu-1002', firstName: 'Ananya', lastName: 'Iyer', email: 'ananya.iyer@example.com', phone: '9876501234', course: 'Design', year: 3, status: 'Active' },
  { id: 'stu-1003', firstName: 'Ishaan', lastName: 'Patel', email: 'ishaan.patel@example.com', phone: '9123456780', course: 'Engineering', year: 1, status: 'Active' },
  { id: 'stu-1004', firstName: 'Meera', lastName: 'Nair', email: 'meera.nair@example.com', phone: '9988776655', course: 'Psychology', year: 4, status: 'Inactive' },
  { id: 'stu-1005', firstName: 'Kabir', lastName: 'Reddy', email: 'kabir.reddy@example.com', phone: '9098765432', course: 'Business', year: 2, status: 'Active' },
  { id: 'stu-1006', firstName: 'Diya', lastName: 'Banerjee', email: 'diya.banerjee@example.com', phone: '9345678120', course: 'Computer Science', year: 1, status: 'Active' },
  { id: 'stu-1007', firstName: 'Arjun', lastName: 'Menon', email: 'arjun.menon@example.com', phone: '9765432108', course: 'Engineering', year: 3, status: 'Inactive' },
  { id: 'stu-1008', firstName: 'Sara', lastName: 'Khan', email: 'sara.khan@example.com', phone: '9812345670', course: 'Design', year: 2, status: 'Active' },
  { id: 'stu-1009', firstName: 'Vivaan', lastName: 'Desai', email: 'vivaan.desai@example.com', phone: '9654321870', course: 'Business', year: 4, status: 'Active' },
]

function readStudents() {
  const saved = window.localStorage.getItem(STORAGE_KEY)
  if (saved === null) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleStudents))
    return sampleStudents
  }
  const students = JSON.parse(saved)
  if (!Array.isArray(students)) throw new Error('Student data could not be read.')
  return students
}

function writeStudents(students) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(students))
}

export async function getStudents() {
  await delay()
  return readStudents()
}

export async function getStudent(id) {
  await delay()
  return readStudents().find((student) => student.id === id) ?? null
}

export async function createStudent(data) {
  await delay()
  const students = readStudents()
  const student = { ...data, id: `stu-${Date.now()}` }
  writeStudents([student, ...students])
  return student
}

export async function updateStudent(id, data) {
  await delay()
  const students = readStudents()
  const index = students.findIndex((student) => student.id === id)
  if (index === -1) throw new Error('Student could not be found.')
  const student = { ...students[index], ...data, id }
  students[index] = student
  writeStudents(students)
  return student
}

export async function deleteStudent(id) {
  await delay()
  const students = readStudents()
  const remaining = students.filter((student) => student.id !== id)
  if (remaining.length === students.length) throw new Error('Student could not be found.')
  writeStudents(remaining)
}
