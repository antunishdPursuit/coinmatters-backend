const express = require("express");

const { getUser } = require("../queries/users.js");
const lists = express.Router();
const {
  getUserLists,
  newList,
  deleteList,
  updateList,
} = require("../queries/lists.js");
const { checkIds } = require("../validations/ids.js");
const { requireLogin } = require("../verification/checkAuth.js");
const { validate, listProblem } = require("../validations/input.js");

// The user_id in the path must be the logged-in user's own.
const requireOwnUser = (req, res, next) => {
  if (Number(req.params.user_id) !== req.user.user_id) {
    return res.status(403).json({ error: "Not allowed" });
  }
  next();
};

// Every lists route needs a logged-in user.
lists.use(requireLogin);

// SHOW a user and their lists
lists.get("/user/:user_id", checkIds("user_id"), requireOwnUser, async (req, res) => {
  const { user_id } = req.params;
  const user = await getUser(user_id);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  const userLists = await getUserLists(user_id);
  res.json({ user, lists: userLists });
});

// CREATE a list for the logged-in user
lists.post("/:user_id", checkIds("user_id"), requireOwnUser, validate(listProblem), async (req, res) => {
  const newListData = {
    user_id: req.user.user_id,
    list_name: req.body.list_name,
    products: req.body.products,
    note: req.body.note,
    date_created: req.body.date_created,
  };
  const createdList = await newList(newListData);
  res.status(200).json(createdList);
});

// UPDATE a list for a specific user
lists.put("/user/:user_id/:id", checkIds("user_id", "id"), requireOwnUser, validate(listProblem), async (req, res) => {
  const { id } = req.params;
  const updatedListData = {
    list_name: req.body.list_name,
    products: req.body.products,
    note: req.body.note,
  };
  const updatedList = await updateList(id, req.user.user_id, updatedListData);
  if (!updatedList) {
    return res.status(404).json({ error: "List not found" });
  }
  res.status(200).json(updatedList);
});

// DELETE a list for a specific user
lists.delete("/user/:user_id/:id", checkIds("user_id", "id"), requireOwnUser, async (req, res) => {
  const { id } = req.params;
  const deletedList = await deleteList(id, req.user.user_id);
  if (!deletedList) {
    return res.status(404).json({ error: "List not found" });
  }
  res.status(200).json(deletedList);
});

module.exports = lists;
