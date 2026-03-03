import { PrismaClient } from '@prisma/client'
import { hash } from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting education system seed...')

  // Get existing organization (created by main seed)
  const membership = await prisma.organizationMember.findFirst({
    where: { user: { email: 'admin@example.com' } },
    include: { organization: true },
  })

  if (!membership) {
    console.error('No organization found. Please run main seed first.')
    return
  }

  const organization = membership.organization
  console.log('Using organization:', organization.name)

  // Create academic session
  const session = await prisma.academicSession.create({
    data: {
      organizationId: organization.id,
      name: '2024-2025 Academic Year',
      startDate: new Date('2024-09-01'),
      endDate: new Date('2025-06-30'),
      isActive: true,
    },
  })
  console.log('Created academic session:', session.name)

  // Create teachers
  const teachers = await Promise.all([
    prisma.teacher.create({
      data: {
        organizationId: organization.id,
        firstName: 'John',
        lastName: 'Smith',
        email: 'john.smith@school.com',
        phone: '+1-555-0101',
        employeeId: 'T001',
        qualification: 'M.Ed. Mathematics',
        specialization: 'Mathematics',
      },
    }),
    prisma.teacher.create({
      data: {
        organizationId: organization.id,
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah.johnson@school.com',
        phone: '+1-555-0102',
        employeeId: 'T002',
        qualification: 'Ph.D. Physics',
        specialization: 'Science',
      },
    }),
    prisma.teacher.create({
      data: {
        organizationId: organization.id,
        firstName: 'Michael',
        lastName: 'Williams',
        email: 'michael.williams@school.com',
        phone: '+1-555-0103',
        employeeId: 'T003',
        qualification: 'M.A. English Literature',
        specialization: 'English',
      },
    }),
  ])
  console.log('Created', teachers.length, 'teachers')

  // Create students
  const students = await Promise.all([
    prisma.student.create({
      data: {
        organizationId: organization.id,
        firstName: 'Emma',
        lastName: 'Davis',
        email: 'emma.davis@student.school.com',
        studentId: 'S001',
        dateOfBirth: new Date('2010-05-15'),
        gender: 'Female',
      },
    }),
    prisma.student.create({
      data: {
        organizationId: organization.id,
        firstName: 'Liam',
        lastName: 'Brown',
        email: 'liam.brown@student.school.com',
        studentId: 'S002',
        dateOfBirth: new Date('2010-08-22'),
        gender: 'Male',
      },
    }),
    prisma.student.create({
      data: {
        organizationId: organization.id,
        firstName: 'Olivia',
        lastName: 'Wilson',
        email: 'olivia.wilson@student.school.com',
        studentId: 'S003',
        dateOfBirth: new Date('2010-03-10'),
        gender: 'Female',
      },
    }),
    prisma.student.create({
      data: {
        organizationId: organization.id,
        firstName: 'Noah',
        lastName: 'Taylor',
        email: 'noah.taylor@student.school.com',
        studentId: 'S004',
        dateOfBirth: new Date('2010-11-05'),
        gender: 'Male',
      },
    }),
    prisma.student.create({
      data: {
        organizationId: organization.id,
        firstName: 'Ava',
        lastName: 'Anderson',
        email: 'ava.anderson@student.school.com',
        studentId: 'S005',
        dateOfBirth: new Date('2010-07-18'),
        gender: 'Female',
      },
    }),
  ])
  console.log('Created', students.length, 'students')

  // Create classes
  const classes = await Promise.all([
    prisma.class.create({
      data: {
        organizationId: organization.id,
        sessionId: session.id,
        teacherId: teachers[0].id,
        name: 'Mathematics 101',
        code: 'MATH101',
        description: 'Introduction to Algebra and Geometry',
        capacity: 30,
        room: 'Room 101',
        schedule: 'Mon, Wed, Fri 9:00 AM - 10:00 AM',
      },
    }),
    prisma.class.create({
      data: {
        organizationId: organization.id,
        sessionId: session.id,
        teacherId: teachers[1].id,
        name: 'Science 101',
        code: 'SCI101',
        description: 'Introduction to Physics and Chemistry',
        capacity: 25,
        room: 'Room 201',
        schedule: 'Tue, Thu 10:00 AM - 11:30 AM',
      },
    }),
    prisma.class.create({
      data: {
        organizationId: organization.id,
        sessionId: session.id,
        teacherId: teachers[2].id,
        name: 'English 101',
        code: 'ENG101',
        description: 'Introduction to Literature and Composition',
        capacity: 28,
        room: 'Room 301',
        schedule: 'Mon, Wed, Fri 11:00 AM - 12:00 PM',
      },
    }),
  ])
  console.log('Created', classes.length, 'classes')

  // Create enrollments
  for (const cls of classes) {
    for (const student of students) {
      await prisma.enrollment.create({
        data: {
          classId: cls.id,
          studentId: student.id,
          status: 'ACTIVE',
        },
      })
    }
  }
  console.log('Created enrollments for all students')

  // Create grades
  const today = new Date()
  const gradeData = [
    { classIndex: 0, studentIndex: 0, title: 'Chapter 1 Quiz', score: 85, maxScore: 100, type: 'QUIZ' },
    { classIndex: 0, studentIndex: 1, title: 'Chapter 1 Quiz', score: 92, maxScore: 100, type: 'QUIZ' },
    { classIndex: 0, studentIndex: 2, title: 'Chapter 1 Quiz', score: 78, maxScore: 100, type: 'QUIZ' },
    { classIndex: 1, studentIndex: 0, title: 'Lab Report 1', score: 45, maxScore: 50, type: 'ASSIGNMENT' },
    { classIndex: 1, studentIndex: 1, title: 'Lab Report 1', score: 48, maxScore: 50, type: 'ASSIGNMENT' },
    { classIndex: 2, studentIndex: 2, title: 'Essay 1', score: 88, maxScore: 100, type: 'ASSIGNMENT' },
  ]

  for (const gd of gradeData) {
    const percentage = (gd.score / gd.maxScore) * 100
    let letterGrade = 'F'
    if (percentage >= 90) letterGrade = 'A'
    else if (percentage >= 80) letterGrade = 'B'
    else if (percentage >= 70) letterGrade = 'C'
    else if (percentage >= 60) letterGrade = 'D'

    await prisma.grade.create({
      data: {
        classId: classes[gd.classIndex].id,
        studentId: students[gd.studentIndex].id,
        sessionId: session.id,
        title: gd.title,
        type: gd.type as any,
        score: gd.score,
        maxScore: gd.maxScore,
        percentage,
        letterGrade,
        date: today,
      },
    })
  }
  console.log('Created sample grades')

  // Create attendance
  const attendanceStatuses = ['PRESENT', 'PRESENT', 'PRESENT', 'LATE', 'PRESENT'] as const
  for (let i = 0; i < students.length; i++) {
    for (const cls of classes) {
      await prisma.attendance.create({
        data: {
          classId: cls.id,
          studentId: students[i].id,
          sessionId: session.id,
          date: today,
          status: attendanceStatuses[i] as any,
        },
      })
    }
  }
  console.log('Created attendance records for today')

  console.log('\n✅ Education system seed completed successfully!')
  console.log('\n📚 Education Data Created:')
  console.log(`  ${teachers.length} Teachers`)
  console.log(`  ${students.length} Students`)
  console.log(`  ${classes.length} Classes`)
  console.log(`  1 Academic Session`)
  console.log('  Sample grades and attendance records')
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
