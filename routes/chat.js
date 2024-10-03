import express from "express";
import { addMembers, getMyChats, getMyGroups, leaveGroup, newGroupChat, removeMember } from "../controllers/chat.js";
import { isAuthenticated } from "../middlewares/auth.js";

const app = express.Router();

app.use(isAuthenticated)
app.post("/new", newGroupChat)
app.get("/my", getMyChats)
app.get("/my/groups", getMyGroups)
app.put("/addmembers", addMembers)
app.delete("/removemember", removeMember)
app.put("/leave/:id", leaveGroup)


export default app;