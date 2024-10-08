import { compare } from "bcrypt";
import { User } from "../models/user.js";
import { cookieOptions, sendToken } from "../utils/features.js";
import { TryCatch } from "../middlewares/error.js";
import { ErrorHandler } from "../utils/utility.js";

const newUser = async (req, res) => {

    const { name, username, password, bio } = req.body
    console.log(req.body)

    const avatar = {
        public_id: "erewrew",
        url: "https://res.cloudinary.com/dxq6jyqz0/image/upload/v1654456400/chaman_hf7j1n.jpg"
    }
    const newUser = await User.create({
        name,
        bio,
        username,
        password,
        avatar
    })

    sendToken(res, newUser, 201, "User created successfully")

}


const login = TryCatch(async (req, res, next) => {
    const { username, password } = req.body

    const user = await User.findOne({ username }).select("+password")
    if (!user) return next(new ErrorHandler("Invalid username or password", 404))

    const isMatch = await compare(password, user.password)

    if (!isMatch) return next(new ErrorHandler("Invalid username or password", 404))

    sendToken(res, user, 200, `welcome back ${user.name}`)
})

const getMyProfile = TryCatch(async (req, res) => {

    const user = await User.findById(req.userId).select("-password")
    res.status(200).json({ success: true, user })
})

const logout = TryCatch(async (req, res) => {

    res.status(200).cookie("chatApp-Token", "", { ...cookieOptions, maxAge: 0 }).json({ success: true, message: "logged out successfully" })
})

const searchUser = TryCatch(async (req, res) => {

    const {name} = req.query

    res.status(200).json({ success: true, message: name })
})

export {
    newUser,
    login,
    getMyProfile,
    logout,
    searchUser
}