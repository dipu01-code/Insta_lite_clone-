require("dotenv").config();

const prisma = require("../src/db");
const { users, posts } = require("./seed-data");

async function main() {
  // Delete all posts first (due to foreign key constraint), then users
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();

  // Create all 12 users in one query
  const userResult = await prisma.user.createMany({
    data: users.map((user) => ({
      ...user,
      createdAt: new Date(user.createdAt),
    })),
  });

  // Get the created users to get their IDs for post assignment
  const createdUsers = await prisma.user.findMany({
    select: { id: true },
    orderBy: { id: "asc" },
  });

  // Create all 24 posts in one query
  // Assign posts round-robin to the 12 users
  const postResult = await prisma.post.createMany({
    data: posts.map((post, index) => ({
      ...post,
      createdAt: new Date(post.createdAt),
      authorId: createdUsers[index % createdUsers.length].id,
    })),
  });

  console.log(`🌱 Seeded ${userResult.count} users and ${postResult.count} posts`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });