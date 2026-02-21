import { PrismaClient, UserRole, TicketStatus, TicketPriority, TicketType, ProjectVisibility } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create users
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'john@example.com' },
      update: {},
      create: {
        email: 'john@example.com',
        name: 'John Doe',
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
      },
    }),
    prisma.user.upsert({
      where: { email: 'alice@example.com' },
      update: {},
      create: {
        email: 'alice@example.com',
        name: 'Alice Smith',
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice',
      },
    }),
    prisma.user.upsert({
      where: { email: 'mike@example.com' },
      update: {},
      create: {
        email: 'mike@example.com',
        name: 'Mike Johnson',
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike',
      },
    }),
    prisma.user.upsert({
      where: { email: 'sarah@example.com' },
      update: {},
      create: {
        email: 'sarah@example.com',
        name: 'Sarah Wilson',
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
      },
    }),
  ]);

  console.log(`✅ Created ${users.length} users`);

  // Create organization
  const org = await prisma.organization.upsert({
    where: { slug: 'acme-corp' },
    update: {},
    create: {
      name: 'Acme Corporation',
      slug: 'acme-corp',
      description: 'A sample organization for demonstration',
      logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=acme',
      ownerId: users[0].id,
      members: {
        create: [
          { userId: users[0].id, role: UserRole.OWNER },
          { userId: users[1].id, role: UserRole.ADMIN },
          { userId: users[2].id, role: UserRole.MANAGER },
          { userId: users[3].id, role: UserRole.MEMBER },
        ],
      },
    },
    include: { members: true },
  });

  console.log(`✅ Created organization: ${org.name}`);

  // Create projects
  const projects = await Promise.all([
    prisma.project.create({
      data: {
        organizationId: org.id,
        name: 'Website Redesign',
        key: 'WEB',
        description: 'Complete overhaul of the company website with new design system',
        color: '#3B82F6',
        visibility: ProjectVisibility.PUBLIC,
        progress: 75,
        members: {
          create: [
            { userId: users[0].id, role: UserRole.MANAGER },
            { userId: users[1].id, role: UserRole.MEMBER },
            { userId: users[2].id, role: UserRole.MEMBER },
          ],
        },
      },
    }),
    prisma.project.create({
      data: {
        organizationId: org.id,
        name: 'Mobile App MVP',
        key: 'APP',
        description: 'Build the minimum viable product for iOS and Android',
        color: '#8B5CF6',
        visibility: ProjectVisibility.PUBLIC,
        progress: 45,
        members: {
          create: [
            { userId: users[1].id, role: UserRole.MANAGER },
            { userId: users[3].id, role: UserRole.MEMBER },
          ],
        },
      },
    }),
    prisma.project.create({
      data: {
        organizationId: org.id,
        name: 'API Integration',
        key: 'API',
        description: 'Third-party API integrations and documentation',
        color: '#10B981',
        visibility: ProjectVisibility.PUBLIC,
        progress: 90,
        members: {
          create: [
            { userId: users[2].id, role: UserRole.MANAGER },
            { userId: users[0].id, role: UserRole.MEMBER },
          ],
        },
      },
    }),
  ]);

  console.log(`✅ Created ${projects.length} projects`);

  // Create Kanban columns for each project
  for (const project of projects) {
    await prisma.kanbanColumn.createMany({
      data: [
        { projectId: project.id, name: 'Backlog', color: '#6B7280', order: 0 },
        { projectId: project.id, name: 'To Do', color: '#3B82F6', order: 1 },
        { projectId: project.id, name: 'In Progress', color: '#F59E0B', order: 2 },
        { projectId: project.id, name: 'In Review', color: '#8B5CF6', order: 3 },
        { projectId: project.id, name: 'Done', color: '#10B981', order: 4 },
      ],
    });
  }

  console.log(`✅ Created Kanban columns for all projects`);

  // Create tickets
  let ticketNumber = 1;
  const tickets = [];

  for (const project of projects) {
    const columns = await prisma.kanbanColumn.findMany({
      where: { projectId: project.id },
      orderBy: { order: 'asc' },
    });

    const projectTickets = [
      {
        projectId: project.id,
        number: ticketNumber++,
        key: `${project.key}-${ticketNumber - 1}`,
        title: 'Implement user authentication flow',
        description: 'Set up OAuth authentication with Google and GitHub providers',
        type: TicketType.FEATURE,
        status: TicketStatus.IN_PROGRESS,
        priority: TicketPriority.HIGH,
        assigneeId: users[0].id,
        reporterId: users[1].id,
        columnId: columns[2].id,
      },
      {
        projectId: project.id,
        number: ticketNumber++,
        key: `${project.key}-${ticketNumber - 1}`,
        title: 'Fix navigation menu on mobile devices',
        description: 'The hamburger menu is not working properly on iOS Safari',
        type: TicketType.BUG,
        status: TicketStatus.TODO,
        priority: TicketPriority.CRITICAL,
        assigneeId: users[1].id,
        reporterId: users[0].id,
        columnId: columns[1].id,
      },
      {
        projectId: project.id,
        number: ticketNumber++,
        key: `${project.key}-${ticketNumber - 1}`,
        title: 'Design system documentation',
        description: 'Create comprehensive documentation for the design system components',
        type: TicketType.DOCUMENTATION,
        status: TicketStatus.BACKLOG,
        priority: TicketPriority.LOW,
        assigneeId: users[2].id,
        reporterId: users[0].id,
        columnId: columns[0].id,
      },
      {
        projectId: project.id,
        number: ticketNumber++,
        key: `${project.key}-${ticketNumber - 1}`,
        title: 'Dashboard analytics widgets',
        description: 'Implement real-time analytics charts and widgets',
        type: TicketType.FEATURE,
        status: TicketStatus.IN_REVIEW,
        priority: TicketPriority.MEDIUM,
        assigneeId: users[2].id,
        reporterId: users[1].id,
        columnId: columns[3].id,
        progress: 90,
      },
      {
        projectId: project.id,
        number: ticketNumber++,
        key: `${project.key}-${ticketNumber - 1}`,
        title: 'Setup CI/CD pipeline',
        description: 'Configure GitHub Actions for automated testing and deployment',
        type: TicketType.TASK,
        status: TicketStatus.DONE,
        priority: TicketPriority.HIGH,
        assigneeId: users[3].id,
        reporterId: users[0].id,
        columnId: columns[4].id,
        progress: 100,
      },
    ];

    for (const ticketData of projectTickets) {
      const ticket = await prisma.ticket.create({ data: ticketData });
      tickets.push(ticket);
    }
  }

  console.log(`✅ Created ${tickets.length} tickets`);

  // Create activities
  const activities = [
    {
      organizationId: org.id,
      projectId: projects[0].id,
      ticketId: tickets[0].id,
      userId: users[0].id,
      type: 'STATUS_CHANGED',
      description: `moved ${tickets[0].key} to In Progress`,
    },
    {
      organizationId: org.id,
      projectId: projects[0].id,
      ticketId: tickets[1].id,
      userId: users[1].id,
      type: 'CREATED',
      description: `created ticket ${tickets[1].key}`,
    },
    {
      organizationId: org.id,
      projectId: projects[1].id,
      ticketId: tickets[2].id,
      userId: users[2].id,
      type: 'ASSIGNED',
      description: `assigned ${tickets[2].key} to ${users[2].name}`,
    },
    {
      organizationId: org.id,
      projectId: projects[2].id,
      userId: users[3].id,
      type: 'CREATED',
      description: `completed CI/CD setup for ${projects[2].name}`,
    },
  ];

  for (const activity of activities) {
    await prisma.activity.create({ data: activity });
  }

  console.log(`✅ Created ${activities.length} activities`);

  // Create notifications
  const notifications = [
    {
      userId: users[0].id,
      type: 'TICKET_ASSIGNED',
      title: 'New ticket assigned',
      message: `You have been assigned to ${tickets[0].key}: ${tickets[0].title}`,
      isRead: false,
    },
    {
      userId: users[1].id,
      type: 'PROJECT_INVITED',
      title: 'Project invitation',
      message: `You have been added to project ${projects[0].name}`,
      isRead: false,
    },
    {
      userId: users[2].id,
      type: 'TICKET_COMMENTED',
      title: 'New comment',
      message: `Someone commented on ${tickets[2].key}`,
      isRead: true,
    },
  ];

  for (const notification of notifications) {
    await prisma.notification.create({ data: notification });
  }

  console.log(`✅ Created ${notifications.length} notifications`);

  // Create chat channels
  const channels = await Promise.all([
    prisma.chatChannel.create({
      data: {
        organizationId: org.id,
        name: 'General',
        description: 'General team discussions',
        type: 'public',
      },
    }),
    prisma.chatChannel.create({
      data: {
        organizationId: org.id,
        name: 'Development',
        description: 'Development team chat',
        type: 'public',
      },
    }),
    prisma.chatChannel.create({
      data: {
        organizationId: org.id,
        name: 'Design',
        description: 'Design team discussions',
        type: 'public',
      },
    }),
  ]);

  // Add members to channels
  for (const channel of channels) {
    await prisma.chatMember.createMany({
      data: users.map((user) => ({
        channelId: channel.id,
        userId: user.id,
      })),
    });
  }

  // Create some chat messages
  const messages = [
    { channelId: channels[0].id, userId: users[0].id, content: 'Hey team! Welcome to Synchro PM!' },
    { channelId: channels[0].id, userId: users[1].id, content: 'Thanks John! Excited to be here.' },
    { channelId: channels[1].id, userId: users[2].id, content: 'The new features are looking great!' },
    { channelId: channels[2].id, userId: users[3].id, content: 'Design review at 3pm today' },
  ];

  for (const msg of messages) {
    await prisma.chatMessage.create({ data: msg });
  }

  console.log(`✅ Created ${channels.length} chat channels with messages`);

  console.log('\n🎉 Seed completed successfully!');
  console.log(`
Summary:
- ${users.length} users created
- 1 organization: ${org.name}
- ${projects.length} projects
- ${tickets.length} tickets
- ${activities.length} activities
- ${notifications.length} notifications
- ${channels.length} chat channels
  `);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
