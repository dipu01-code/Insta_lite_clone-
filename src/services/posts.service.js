const prisma = require("../db");

const POST_SELECT = {
  id: true,
  imageUrl: true,
  caption: true,
  location: true,
  createdAt: true,
  updatedAt: true,
};

async function createPost(data) {
  // The lab ignores authorId from the client, but the schema requires it,
  // so default to the first user when it is not provided.
  const authorId = data.authorId ?? 1;

  return prisma.post.create({
    data: {
      authorId,
      ...data,
    },
    select: POST_SELECT,
  });
}

async function listPosts() {
  return prisma.post.findMany({ select: POST_SELECT });
}

async function getPostById(id) {
  return prisma.post.findUnique({ where: { id }, select: POST_SELECT });
}

async function updatePost(id, data) {
  return prisma.post.update({ where: { id }, data, select: POST_SELECT });
}

async function deletePost(id) {
  return prisma.post.delete({ where: { id }, select: POST_SELECT });
}

module.exports = {
  createPost,
  listPosts,
  getPostById,
  updatePost,
  deletePost,
};