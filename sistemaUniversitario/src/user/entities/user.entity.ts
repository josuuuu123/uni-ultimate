import { User as PrismaUser } from '@prisma/client-auth';

export class User implements PrismaUser {
  id: number;
  name: string;
  email: string;
  username: string;
  password: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}