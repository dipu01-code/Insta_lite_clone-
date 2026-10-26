const postsService = require("../services/posts.service");

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

  const allowedSortBy = ["createdAt", "updatedAt"];
  const allowedOrder = ["asc", "desc"];

  if (!allowedSortBy.includes(sortBy)) {
    return { error: "sortBy must be one of: createdAt, updatedAt" };
  }
  if (!allowedOrder.includes(order)) {
    return { error: "order must be asc or desc" };
  }

  return { sortBy, order };
}

function parseFilters(query) {
  const where = {};

  if (query.location !== undefined) {
    where.location = {
      equals: query.location,
      mode: "insensitive",
    };
  }

  if (query.search) {
    where.caption = {
      contains: query.search,
      mode: "insensitive",
    };
  }

  if (query.from !== undefined || query.to !== undefined) {
    const fromDate = query.from ? new Date(query.from) : null;
    const toDate = query.to ? new Date(query.to) : null;

    if (
      (query.from !== undefined && Number.isNaN(fromDate.getTime())) ||
      (query.to !== undefined && Number.isNaN(toDate.getTime()))
    ) {
      return { error: "from and to must be valid dates" };
    }

    where.createdAt = {};

    if (fromDate !== null) {
      where.createdAt.gte = fromDate;
    }
    if (toDate !== null) {
      where.createdAt.lt = toDate;
    }
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
  const { imageUrl, caption, location } = req.body ?? {};

  if (!imageUrl) {
    return res.status(400).json({ error: "imageUrl is required" });
  }

  try {
    const post = await postsService.createPost({
      imageUrl,
      ...(caption !== undefined ? { caption } : {}),
      ...(location !== undefined ? { location } : {}),
    });
    return res.status(201).json(post);
  } catch (error) {
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
    const [data, total] = await postsService.listPosts({
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
  if (id === null) return res.status(404).json({ error: "Post not found" });

  try {
    const post = await postsService.getPostById(id);
    if (!post) return res.status(404).json({ error: "Post not found" });
    return res.status(200).json(post);
  } catch (error) {
    return error500(res, error);
  }
}

async function update(req, res) {
  const id = validId(req.params.id);
  if (id === null) return res.status(404).json({ error: "Post not found" });

  const body = req.body ?? {};
  const data = {};

  for (const field of ["caption", "location"]) {
    if (Object.hasOwn(body, field)) data[field] = body[field];
  }

  try {
    const post = await postsService.updatePost(id, data);
    return res.status(200).json(post);
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Post not found" });
    }
    return error500(res, error);
  }
}

async function remove(req, res) {
  const id = validId(req.params.id);
  if (id === null) return res.status(404).json({ error: "Post not found" });

  try {
    await postsService.deletePost(id);
    return res.status(204).end();
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Post not found" });
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