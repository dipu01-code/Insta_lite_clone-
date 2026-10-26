const usersService = require("../services/users.service");

function validId(value) {
  if (!/^[1-9]\d*$/.test(String(value))) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) ? id : null;
}

function error500(res, error) {
  console.error(error);
  return res.status(500).json({ error: "Internal server error" });
}

async function create(req, res) {
  const { username, email, fullname, bio } = req.body ?? {};

  if (!username || !email || !fullname) {
    return res.status(400).json({
      error: "username, email and fullname are required",
    });
  }

  try {
    const user = await usersService.createUser({
      username,
      email,
      fullname,
      ...(bio !== undefined ? { bio } : {}),
    });
    return res.status(201).json(user);
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        error: "username or email already taken",
      });
    }
    return error500(res, error);
  }
}

async function list(req, res) {
  try {
    const users = await usersService.listUsers();
    return res.status(200).json(users);
  } catch (error) {
    return error500(res, error);
  }
}

async function getOne(req, res) {
  const id = validId(req.params.id);
  if (id === null) return res.status(404).json({ error: "User not found" });

  try {
    const user = await usersService.getUserById(id);
    if (!user) return res.status(404).json({ error: "User not found" });
    return res.status(200).json(user);
  } catch (error) {
    return error500(res, error);
  }
}

async function update(req, res) {
  const id = validId(req.params.id);
  if (id === null) return res.status(404).json({ error: "User not found" });

  const body = req.body ?? {};
  const data = {};

  for (const field of ["fullname", "bio", "isPrivate"]) {
    if (Object.hasOwn(body, field)) data[field] = body[field];
  }

  if (
    Object.hasOwn(data, "isPrivate") &&
    typeof data.isPrivate !== "boolean"
  ) {
    return res.status(400).json({
      error: "isPrivate must be true or false",
    });
  }

  try {
    const user = await usersService.updateUser(id, data);
    return res.status(200).json(user);
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "User not found" });
    }
    return error500(res, error);
  }
}

async function remove(req, res) {
  const id = validId(req.params.id);
  if (id === null) return res.status(404).json({ error: "User not found" });

  try {
    await usersService.deleteUser(id);
    return res.status(204).end();
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "User not found" });
    }
    return error500(res, error);
  }
}

module.exports = {
  create,
  list,
  getOne,
  update,
  remove,
};