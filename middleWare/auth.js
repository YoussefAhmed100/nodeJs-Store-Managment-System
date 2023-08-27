const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");

const jwt = require("jsonwebtoken");


    const protect = asyncHandler(async(req ,res ,next)=>{
        try {
            const token = req.cookies.token;
            if(!token){
                res.status(401).json({message:"not authorized, please login"})
            }
            //verify token 
            const verified = jwt.verify(token , process.env.JWT_SECRET);
             //get user id from token 
             const user = await User.findById(verified.id).select("-password")

             if(!user){
                res.status(401).json({message:"user not found"})
            };
            req.user =user
            next();
            
        } catch (err) {
            res.status(400).json(err)
            
        }
    });
    module.exports = protect