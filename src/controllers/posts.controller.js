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
  try {
    const posts = await postsService.listPosts();
    return res.status(200).json(posts);
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