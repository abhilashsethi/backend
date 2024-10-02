import mongoose from "mongoose"
import jwt from "jsonwebtoken"


const cookieOptions = {
    maxAge: 15 * 24 * 60 * 60 * 1000,
    sameSite: "none",
    httpOnly: true,
    secure: true
}

const connectDB = (uri)=>{
    mongoose.connect(uri, {dbName: "chatApp"}).then((data)=>{
        console.log(`Connect to db ${data.connection.host}`)
    }).catch((err)=>{
        throw err
    })
}

const sendToken = (res, user, code, message)=>{
    const token = jwt.sign({id: user._id}, process.env.JWT_SECRET)

    return res.status(code).cookie("chatApp-Token", token,cookieOptions).json({
        success: true,
        user,
        message
    })

    
}

export {connectDB, sendToken}