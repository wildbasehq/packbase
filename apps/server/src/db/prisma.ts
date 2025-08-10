import { PrismaClient } from '@prisma/client';
import Debug from 'debug';

const log = {
  info: Debug('vg:prisma'),
  error: Debug('vg:prisma:error'),
};

// Add prisma to the NodeJS global type
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Prevent multiple instances of Prisma Client in development
const prisma = global.prisma || new PrismaClient();
global.prisma = prisma;

// Initialize the client
prisma.$connect()
  .then(() => {
    log.info('Prisma client connected to database');
  })
  .catch((error) => {
    log.error('Failed to connect to database', error);
  });

export default prisma;
