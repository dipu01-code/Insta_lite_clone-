const prisma = require("../db");

const USER_SELECT = {
  id: true,
  username: true,
  email: true,
  fullname: true,
  bio: true,
  isPrivate: true,
  createdAt: true,
  updatedAt: true,
};

async function createUser(data) {
  return prisma.user.create({ data, select: USER_SELECT });
}

async function listUsers({ where, skip, take, orderBy }) {
  return prisma.$transaction([
    prisma.user.findMany({ where, skip, take, orderBy, select: USER_SELECT }),
    prisma.user.count({ where }),
  ]);
}

async function getUserById(id) {
  return prisma.user.findUnique({ where: { id }, select: USER_SELECT });
}

async function updateUser(id, data) {
  return prisma.user.update({ where: { id }, data, select: USER_SELECT });
}

async function deleteUser(id) {
  return prisma.user.delete({ where: { id }, select: USER_SELECT });
}

module.exports = {
  createUser,
  listUsers,
  getUserById,
  updateUser,
  deleteUser,
};