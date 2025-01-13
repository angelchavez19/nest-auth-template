import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: { name: 'ADMIN' },
  });

  console.log('ADMIN role created:', adminRole);

  const userRole = await prisma.role.upsert({
    where: { name: 'USER' },
    update: {},
    create: { name: 'USER' },
  });

  console.log('USER role created:', userRole);

  const viewUserInfoPermission = await prisma.permission.upsert({
    where: { name: 'VIEW USER INFO' },
    update: {},
    create: { name: 'VIEW USER INFO', route: '/user' },
  });

  console.log('VIEW USER INFO permission created:', viewUserInfoPermission);

  const user_permission = await prisma.rolePermission.upsert({
    where: {
      roleId_permissionId: {
        roleId: userRole.id,
        permissionId: viewUserInfoPermission.id,
      },
    },
    update: {},
    create: { roleId: userRole.id, permissionId: viewUserInfoPermission.id },
  });

  console.log('USER PERMISSION created:', user_permission);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
