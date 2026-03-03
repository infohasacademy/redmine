import { PrismaClient } from '@prisma/client'
import { hash } from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting seed...')

  // Create users first
  const hashedPassword = await hash('admin123', 12)
  
  const admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      name: 'Admin User',
      password: hashedPassword,
      emailVerified: new Date(),
      isActive: true,
    },
  })
  console.log('Created admin user:', admin.email)

  const manager = await prisma.user.create({
    data: {
      email: 'manager@example.com',
      name: 'Manager User',
      password: await hash('demo123', 12),
      emailVerified: new Date(),
      isActive: true,
    },
  })
  console.log('Created manager user:', manager.email)

  const developer = await prisma.user.create({
    data: {
      email: 'developer@example.com',
      name: 'Developer User',
      password: await hash('demo123', 12),
      emailVerified: new Date(),
      isActive: true,
    },
  })
  console.log('Created developer user:', developer.email)

  // Create demo organization with owner
  const organization = await prisma.organization.create({
    data: {
      name: 'Demo Organization',
      slug: 'demo-org',
      description: 'A demo organization for testing',
      subscriptionPlan: 'PROFESSIONAL',
      subscriptionStatus: 'ACTIVE',
      maxMembers: 50,
      maxProjects: 100,
      maxStorageMB: 5000,
      ownerId: admin.id,
    },
  })
  console.log('Created organization:', organization.name)

  // Add organization members
  await prisma.organizationMember.createMany({
    data: [
      { organizationId: organization.id, userId: admin.id, role: 'OWNER' },
      { organizationId: organization.id, userId: manager.id, role: 'ADMIN' },
      { organizationId: organization.id, userId: developer.id, role: 'MEMBER' },
    ],
    skipDuplicates: true,
  })
  console.log('Added organization members')

  // Create project
  const project = await prisma.project.create({
    data: {
      organizationId: organization.id,
      name: 'Demo Project',
      key: 'DEMO',
      description: 'A demonstration project',
      visibility: 'PUBLIC',
    },
  })
  console.log('Created project:', project.name)

  // Add project members
  await prisma.projectMember.createMany({
    data: [
      { projectId: project.id, userId: admin.id, role: 'ADMIN' },
      { projectId: project.id, userId: manager.id, role: 'MANAGER' },
      { projectId: project.id, userId: developer.id, role: 'MEMBER' },
    ],
    skipDuplicates: true,
  })
  console.log('Added project members')

  // Create Kanban columns
  const columns = await Promise.all([
    prisma.kanbanColumn.create({
      data: { projectId: project.id, name: 'Backlog', color: '#6B7280', order: 0 },
    }),
    prisma.kanbanColumn.create({
      data: { projectId: project.id, name: 'To Do', color: '#3B82F6', order: 1 },
    }),
    prisma.kanbanColumn.create({
      data: { projectId: project.id, name: 'In Progress', color: '#F59E0B', order: 2 },
    }),
    prisma.kanbanColumn.create({
      data: { projectId: project.id, name: 'In Review', color: '#8B5CF6', order: 3 },
    }),
    prisma.kanbanColumn.create({
      data: { projectId: project.id, name: 'Done', color: '#10B981', order: 4 },
    }),
  ])
  console.log('Created', columns.length, 'Kanban columns')

  // Create some tickets
  const tickets = await Promise.all([
    prisma.ticket.create({
      data: {
        projectId: project.id,
        number: 1,
        key: 'DEMO-1',
        title: 'Setup project infrastructure',
        description: 'Initialize the project with proper folder structure and configuration',
        type: 'TASK',
        status: 'DONE',
        priority: 'HIGH',
        reporterId: admin.id,
        assigneeId: developer.id,
        columnId: columns[4].id,
        completedAt: new Date(),
      },
    }),
    prisma.ticket.create({
      data: {
        projectId: project.id,
        number: 2,
        key: 'DEMO-2',
        title: 'Implement user authentication',
        description: 'Add login, registration, and password reset functionality',
        type: 'FEATURE',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        reporterId: admin.id,
        assigneeId: developer.id,
        columnId: columns[2].id,
      },
    }),
    prisma.ticket.create({
      data: {
        projectId: project.id,
        number: 3,
        key: 'DEMO-3',
        title: 'Fix login page styling',
        description: 'The login button is not aligned properly on mobile devices',
        type: 'BUG',
        status: 'TODO',
        priority: 'MEDIUM',
        reporterId: manager.id,
        assigneeId: developer.id,
        columnId: columns[1].id,
      },
    }),
    prisma.ticket.create({
      data: {
        projectId: project.id,
        number: 4,
        key: 'DEMO-4',
        title: 'Add dashboard analytics',
        description: 'Implement analytics dashboard with charts and metrics',
        type: 'FEATURE',
        status: 'BACKLOG',
        priority: 'MEDIUM',
        reporterId: manager.id,
        columnId: columns[0].id,
      },
    }),
    prisma.ticket.create({
      data: {
        projectId: project.id,
        number: 5,
        key: 'DEMO-5',
        title: 'Critical: Database connection issue',
        description: 'Users experiencing connection timeouts during peak hours',
        type: 'BUG',
        status: 'IN_PROGRESS',
        priority: 'CRITICAL',
        reporterId: admin.id,
        assigneeId: admin.id,
        columnId: columns[2].id,
      },
    }),
  ])
  console.log('Created', tickets.length, 'tickets')

  // Create chat channel
  const channel = await prisma.chatChannel.create({
    data: {
      organizationId: organization.id,
      name: 'general',
      description: 'General discussion',
      type: 'public',
    },
  })
  console.log('Created chat channel:', channel.name)

  // Add chat members
  await prisma.chatMember.createMany({
    data: [
      { channelId: channel.id, userId: admin.id },
      { channelId: channel.id, userId: manager.id },
      { channelId: channel.id, userId: developer.id },
    ],
    skipDuplicates: true,
  })

  // Create welcome message
  await prisma.chatMessage.create({
    data: {
      channelId: channel.id,
      userId: admin.id,
      content: 'Welcome to the project! Feel free to ask questions here.',
    },
  })
  console.log('Created chat channel with welcome message')

  console.log('\n✅ Seed completed successfully!')
  console.log('\n📋 Demo Credentials:')
  console.log('  Admin: admin@example.com / admin123')
  console.log('  Manager: manager@example.com / demo123')
  console.log('  Developer: developer@example.com / demo123')
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
