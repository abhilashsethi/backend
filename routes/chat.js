import express from "express";
import { addMembers, deleteChat, getChatDetails, getMyChats, getMyGroups, leaveGroup, newGroupChat, removeMember, renameGroup, sendAttachments } from "../controllers/chat.js";
import { isAuthenticated } from "../middlewares/auth.js";
import { attachmentsMulter } from "../middlewares/multer.js";

const app = express.Router();

app.use(isAuthenticated)
app.post("/new", newGroupChat)
app.get("/my", getMyChats)
app.get("/my/groups", getMyGroups)
app.put("/addmembers", addMembers)
app.delete("/removemember", removeMember)
app.put("/leave/:id", leaveGroup)
app.post("/message", attachmentsMulter,sendAttachments)
app.route("/:id").get(getChatDetails).put(renameGroup).delete(deleteChat)


export default app;