import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as readline from 'readline';

function askQuestion(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function createSuperuser() {
  const prisma = new PrismaClient();

  try {
    const username = await askQuestion('Enter a username: ');
    const email = await askQuestion('Enter an email: ');
    const password = await askQuestion('Enter a password: ');
    const confirmPassword = await askQuestion('Confirm your password: ');
    if (password !== confirmPassword) {
      console.error('Passwords do not match.');
      return;
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const superuser = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        role: {
          connect: {
            name: 'ADMIN',
          },
        },
        isEmailVerified: true,
        isSuperAdmin: true,
      },
    });

    console.log(`Superusuario creado: ${superuser.email}`);
  } catch (error) {
    console.error('Error creando el superusuario:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSuperuser();
