import { prisma } from '../db';

beforeAll(async () => {
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});

afterEach(async () => {
  const deleteEducation = prisma.education.deleteMany();
  const deleteWorkExperience = prisma.workExperience.deleteMany();
  const deleteUserProfile = prisma.userProfile.deleteMany();

  await prisma.$transaction([
    deleteEducation,
    deleteWorkExperience,
    deleteUserProfile,
  ]);
});