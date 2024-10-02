import  jwt  from "jsonwebtoken";
import { TryCatch } from "./error.js";
import { ErrorHandler } from "../utils/utility.js";


const isAuthenticated =  (req, res, next) => {

    const token = req.cookies["chatApp-Token"]
    if (!token) return next(new ErrorHandler("please login to access this route", 401))

    const decodedData = jwt.verify(token, process.env.JWT_SECRET)
    console.log(decodedData)
    req.userId = decodedData.id

    next()
}

export {
    isAuthenticated
}