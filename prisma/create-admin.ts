import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🔐 Creating admin user...');

  const adminEmail = 'Ranelsabah';
  const adminPassword = 'Santafee@@@@@1972';
  const hashedPassword = await bcrypt.hash(adminPassword, 12);

  // Create or update admin user
  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail.toLowerCase() },
    update: {
      password: hashedPassword,
      isActive: true,
      name: 'Ranel Sabah',
      emailVerified: new Date(),
    },
    create: {
      email: adminEmail.toLowerCase(),
      name: 'Ranel Sabah',
      password: hashedPassword,
      isActive: true,
      emailVerified: new Date(),
    },
  });

  console.log(`✅ Admin user created: ${adminUser.email}`);

  // Create default organization if not exists
  let organization = await prisma.organization.findFirst({
    where: { slug: 'default-org' },
  });

  if (!organization) {
    organization = await prisma.organization.create({
      data: {
        name: 'Default Organization',
        slug: 'default-org',
        description: 'Default organization for system administration',
        ownerId: adminUser.id,
        subscriptionPlan: 'ENTERPRISE',
        subscriptionStatus: 'ACTIVE',
        maxMembers: 1000,
        maxProjects: 1000,
        maxStorageMB: 100000,
      },
    });
    console.log(`✅ Default organization created: ${organization.name}`);
  }

  // Add admin as owner of the organization
  const membership = await prisma.organizationMember.upsert({
    where: {
      organizationId_userId: {
        organizationId: organization.id,
        userId: adminUser.id,
      },
    },
    update: {
      role: UserRole.OWNER,
      isActive: true,
    },
    create: {
      organizationId: organization.id,
      userId: adminUser.id,
      role: UserRole.OWNER,
      isActive: true,
    },
  });

  console.log(`✅ Admin is now OWNER of the organization`);

  console.log('\n🎉 Admin setup completed!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Email: ${adminEmail.toLowerCase()}`);
  console.log(`Password: ${adminPassword}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
