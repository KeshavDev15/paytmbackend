const express = require('express');
const zod = require('zod');
const jwt = require('jsonwebtoken');
const JWT_SECRET = require('./config');
const { User, Account } = require('../db');
const { authMiddleware } = require('./middleware');
const router = express.Router();

const signupSchema = zod.object({
    username: zod.string().email(),
    firstName: zod.string(),
    lastName: zod.string(),
    password: zod.string()
})

const signinSchema = zod.object({
    username: zod.string().email(),
    password: zod.string()
})
const updatedSchema = zod.object({
    firstName : zod.string().optional(),
    lastName : zod.string().optional(),
    password: zod.string().optional()
})

router.post('/signup', async(req,res) =>{
    const {success} = signupSchema.safeParse(req.body);
    if(!success){
        return res.status(411).json({
            message: "Email already taken / Incorrect inputs"
        })
    }
    const existingUser = await User.findOne({
        username: req.body.username
    });
    if(existingUser){
        return res.status(411).json({
            message: "Email already taken"
        })
    }
    const user = await User.create(req.body);
    const userId = user._id;
    await Account.create({
        userId,
        balance: 1 + Math.random() * 10000
    })
    const token = jwt.sign({userId}, JWT_SECRET);

    res.status(200).json({
        message: "User created successfully", 
        token: token
    })

    
})

router.post('/signin' , async(req,res) => {
    const {success} = signinSchema.safeParse(req.body);
    if(!success){
        return res.status(411).json({
            message: "Incorrect inputs"
        })
    }
    const user = await User.findOne({
        username: req.body.username,
        password: req.body.password
    })
    if(user){
        const token = jwt.sign({userId: user._id}, JWT_SECRET);
        res.status(200).json({
            message: "User signed in successfully",
            token: token
        })
        return;
    }
    res.status(411).json({
        message: "Error Signing In"
    })

})

router.put('/',authMiddleware,async(req,res)=>{
    const {success} = updatedSchema.safeParse(req.body);
    if(!success){
        return res.status(411).json({
            message : "Invalid Input"
        })
    }
    await User.updateOne({_id : req.userId},req.body)
    res.json({
        message: "Updated successfully"
    })
})

router.get("/bulk", async (req, res) => {
    const filter = req.query.filter || "";

    const users = await User.find({
        $or: [
                {
                   firstName: { "$regex": filter }
                },
                {
                   lastName: { "$regex": filter }
                }
             ]
    })

    res.json({
        user: users.map(user => ({
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            _id: user._id
        }))
    })
})


router.get("/current-user",authMiddleware, async (req, res) => {

    try {
        const user = await User.findById(req.userId).select("-password").select("-username"); // Exclude password
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json(user);
    } catch (error) {
        res.status(401).json({ message: "Invalid token" });
    }
});
module.exports = router;