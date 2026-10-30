const express = require("express");

const { getUser } = require("../queries/users.js");
const lists = express.Router({ mergeParams: true });
const {
  getUserLists,
  newList,
  deleteList,
  updateList,
} = require("../queries/lists.js");

// SHOW a list for a specific user
lists.get("/user/:user_id", async (req, res) => {
  const { user_id } = req.params;
  try {
    // console.log('Fetching user and lists for user_id:', user_id);
    const user = await getUser(user_id);
    const userLists = await getUserLists(user_id);
    // console.log('Fetched user and lists:', { user, lists: userLists });
    res.json({ user, lists: userLists });
  } catch (err) {
    console.error('Error fetching user and lists:', err);
    res.json({ error: "No lists found" });
  }
});

//POST all user lists to the /lists table
lists.post("/:user_id", async (req, res) => {
  const { user_id } = req.params;
  console .log("User ID received in /lists route:", user_id);
  const newListData = {
    user_id,
    list_name: req.body.list_name,
    products: req.body.products,
    note: req.body.note,
    date_created: req.body.date_created,
  };
  try {
    const createdList = await newList(newListData);
    res.status(200).json(createdList);
  } catch (error) {
    res.status(400).json({ error });
  }
});

// UPDATE a list for a specific user
lists.put("/user/:user_id/:id", async (req, res) => {
  const { user_id, id } = req.params;
  const updatedListData = {
    list_name: req.body.list_name,
    products: req.body.products,
    note: req.body.note,
    date_created: req.body.date_created,
  };
  try {
    const updatedList = await updateList(id, updatedListData);
    res.status(200).json(updatedList);
  } catch (error) {
    res.status(404).json({ error: "List not found" });
  }
});

// DELETE a list for a specific user
lists.delete("/user/:user_id/:id", async (req, res) => {
  const { user_id, id } = req.params;
  try {
    const deletedList = await deleteList(id);
    res.status(200).json(deletedList);
  } catch (error) {
    res.status(404).json({ error: "List not found" });
  }
});

module.exports = lists;