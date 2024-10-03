import { TryCatch } from "../middlewares/error.js";
import { ErrorHandler } from "../utils/utility.js";
import { Chat } from "../models/chat.js";
import { User } from "../models/user.js";
import { emitEvent } from "../utils/features.js";
import { ALERT, REFETCH_CHATS } from "../constants/events.js";
import { getOtherMemers } from "../lib/helper.js";



const newGroupChat = TryCatch(async (req, res, next) => {

    const { name, members } = req.body

    if (members.length < 2) return next(new ErrorHandler("group must have atleast 3 members", 400))

    const allMembers = [...members, req.userId]

    await Chat.create({
        name,
        groupChat: true,
        members: allMembers,
        creator: req.userId
    })
    emitEvent(req, ALERT, allMembers, `Welcome to ${name} group`)
    emitEvent(req, REFETCH_CHATS, members)

    return res.status(201).json({ success: true, message: "Group created successfully" })

})


const getMyChats = TryCatch(async (req, res, next) => {

    const chats = await Chat.find({
        members: req.userId
    }).populate("members", "name username avatar")

    const transformedChats = chats.map(({ _id, name, members, groupChat }) => {
        const otherMembers = getOtherMemers(members, req.userId)
        return {
            _id,
            groupChat,
            avatar: groupChat ? members.slice(0, 3).map(({ avatar }) => avatar.url) : [otherMembers.avatar.url],
            name: groupChat ? name : otherMembers.name,
            members: members.reduce((prev, curr) => {
                if (curr._id.toString() !== req.userId.toString()) prev.push(curr._id)
                return prev
            }, [])
        }
    })
    return res.status(200).json({ success: true, chats: transformedChats })
})

const getMyGroups = TryCatch(async (req, res, next) => {

    const chats = await Chat.find({
        members: req.userId,
        groupChat: true,
        creator: req.userId
    }).populate("members", "name avatar")

    const groups = chats.map(({ _id, name, members, groupChat }) => ({
        _id,
        name,
        groupChat,
        avatar: members.slice(0, 3).map(({ avatar }) => avatar.url)
    }))

    return res.status(200).json({ success: true, groups })

})

const addMembers = TryCatch(async (req, res, next) => {
    const { chatId, members } = req.body

    if (!members || members.length < 1) return next(new ErrorHandler("Please provide members", 400))
    const chat = await Chat.findById(chatId)
    if (!chat) return next(new ErrorHandler("chat not found", 404))
    if (!chat.groupChat) {
        return next(new ErrorHandler("this is not a group chat", 400))
    }
    if (chat.creator.toString() !== req.userId.toString()) {
        return next(new ErrorHandler("only group creator can add members", 403))
    }

    const allNewMembersPromise = members.map((i) => User.findById(i, "name"))
    const allNewMembers = await Promise.all(allNewMembersPromise)
    const uniqueMembers = allNewMembers.filter((i) => !chat.members.includes(i._id.toString())).map((i) => i._id)

    chat.members.push(...uniqueMembers)

    if (chat.members.length > 100) {
        return next(new ErrorHandler("group members limit reached", 400))
    }
    await chat.save()

    const allUsersName = allNewMembers.map((i) => i.name).join(", ")

    emitEvent(req, ALERT, chat.members, `${allUsersName} have been added to ${chat.name} group`)
    emitEvent(req, REFETCH_CHATS, chat.members)
    return res.status(200).json({ success: true, message: "members added successfully" })
})


const removeMember = TryCatch(async (req, res, next) => {
    const { chatId, userId } = req.body

    const [chat, userThatWillBeRemoved] = await Promise.all([
        Chat.findById(chatId),
        User.findById(userId)
    ])


    if (!chat) return next(new ErrorHandler("chat not found", 404))
    if (!chat.groupChat) {
        return next(new ErrorHandler("this is not a group chat", 400))
    }
    if (chat.creator.toString() !== req.userId.toString()) {
        return next(new ErrorHandler("only group creator can add members", 403))
    }
    if (chat.members.length <= 3) {
        return next(new ErrorHandler("group must have atleast 3 members", 400))
    }

    chat.members = chat.members.filter((i) => i.toString() !== userId)


    await chat.save()

    emitEvent(req, ALERT, chat.members, `${userThatWillBeRemoved.name} has been removed from the group`)
    emitEvent(req, REFETCH_CHATS, chat.members)
    return res.status(200).json({ success: true, message: "member removed successfully" })
})


const leaveGroup = TryCatch(async (req, res, next) => {
    const chatId = req.params.id
    const chat = await Chat.findById(chatId)
    if (!chat) return next(new ErrorHandler("chat not found", 404))
    if (!chat.groupChat) {
        return next(new ErrorHandler("this is not a group chat", 400))
    }

    const remainingMembers = chat.members.filter((i) => i.toString() !== req.userId.toString())

    if (remainingMembers.length < 3) {
        return next(new ErrorHandler("group must have atleast 3 members", 400))
    }

    if (chat.creator.toString() === req.userId.toString()) {
        const randomNumber = Math.floor(Math.random() * remainingMembers.length)
        const newCreator = remainingMembers[randomNumber]
        chat.creator = newCreator
    }

    chat.members = remainingMembers
    const [user] = await Promise.all([
        User.findById(req.userId, "name"),
        chat.save()
    ])

    emitEvent(req, ALERT, chat.members, `Usser ${user.name} has left the group`)
    return res.status(200).json({ success: true, message: "member left the group" })
})

export {
    newGroupChat,
    getMyChats,
    getMyGroups,
    addMembers,
    removeMember,
    leaveGroup
}