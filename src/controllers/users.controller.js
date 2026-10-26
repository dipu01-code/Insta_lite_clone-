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

function parsePagination(query) {
  const pageText = query.page ?? "1";
  const limitText = query.limit ?? "10";

  if (
    !/^[1-9]\d*$/.test(String(pageText)) ||
    !/^[1-9]\d*$/.test(String(limitText))
  ) {
    return { error: "page and limit must be positive integers" };
  }

  const page = Number(pageText);
  const limit = Math.min(Number(limitText), 50);

  if (
    !Number.isSafeInteger(page) ||
    !Number.isSafeInteger(limit) ||
    page < 1 ||
    limit < 1 ||
    !Number.isSafeInteger((page - 1) * limit)
  ) {
    return { error: "page and limit must be positive integers" };
  }

  return { page, limit, skip: (page - 1) * limit };
}

function parseSorting(query) {
  const sortBy = query.sortBy ?? "createdAt";
  const order = query.order ?? "desc";

  const allowedSortBy = ["createdAt", "username", "fullname"];
  const allowedOrder = ["asc", "desc"];

  if (!allowedSortBy.includes(sortBy)) {
    return { error: "sortBy must be one of: createdAt, username, fullname" };
  }
  if (!allowedOrder.includes(order)) {
    return { error: "order must be asc or desc" };
  }

  return { sortBy, order };
}

function parseFilters(query) {
  const where = {};

  if (query.isPrivate !== undefined) {
    if (!["true", "false"].includes(query.isPrivate)) {
      return { error: "isPrivate must be true or false" };
    }
    where.isPrivate = query.isPrivate === "true";
  }

  if (query.search) {
    where.OR = [
      { username: { contains: query.search, mode: "insensitive" } },
      { fullname: { contains: query.search, mode: "insensitive" } },
    ];
  }

  return { where };
}

function buildMeta(page, limit, total) {
  return {
    page,
    limit,
    total,
    totalPages: total === 0 ? 0 : Math.ceil(total / limit),
  };
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
  const pagination = parsePagination(req.query);
  if (pagination.error) return res.status(400).json({ error: pagination.error });

  const sorting = parseSorting(req.query);
  if (sorting.error) return res.status(400).json({ error: sorting.error });

  const filters = parseFilters(req.query);
  if (filters.error) return res.status(400).json({ error: filters.error });

  try {
    const [data, total] = await usersService.listUsers({
      where: filters.where,
      skip: pagination.skip,
      take: pagination.limit,
      orderBy: { [sorting.sortBy]: sorting.order },
    });

    return res.status(200).json({
      data,
      meta: buildMeta(pagination.page, pagination.limit, total),
    });
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