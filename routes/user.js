const router = require("express").Router();
const User = require("../models/User");
const cryptojs = require("crypto-js");
const jwt = require("jsonwebtoken");
const {verifytoken}=require("../routes/verifyAcessToken");
// const {verifytoken}=require("./verifyAcessToken");
// const { verifytoken } = require("verifyAccessToken");


//register
router.post("/register", async (req, res) => {
    console.log(req.body);
    const { name,username, email, password,image } = req.body;
    const user = new User({
        name:name,
        email:email,
        username:username,
        password:  cryptojs.AES.encrypt(password, process.env.PASS_SEC).toString(),
        profilepicture:image,
    });
    try {
        const saveduser = await user.save();
        res.status(200).json(saveduser);
    } catch (err) {
        console.log(err);
        res.status(500).json(err);
    }
});


//login
router.post("/login", async (req, res) => {
    const username = req.body.email;
    const password = req.body.password;
    const user = await User.findOne({ email: username });
    if (user) {
        // console.log(cryptojs.AES.decrypt(user.password,process.env.PASS_SEC).toString(cryptojs.enc.Utf8));
        if (cryptojs.AES.decrypt(user.password, process.env.PASS_SEC).toString(cryptojs.enc.Utf8) == password.toString()) {
            const { password, ...others } = user._doc;
            const accessToken = jwt.sign({
                id: user._id,
                isAdmin: user.role,
            }, process.env.JWT_SEC);
            res.status(200).json({ ...others, accessToken });
        }
        else {
            res.status(400).json("bad credentials");
        }
    }
    else {
        res.status(400).json("user not found");
    }

});


router.post("/updateuser", verifytoken, async (req, res) => {
    User.findOne({ 'id': Number(req.query.id) })
        .then(User => {
            User.name = req.body.name;
            User.username = req.body.username;
            User.profilepicture = req.body.profilepicture;
            User.save()
                .then((User) => {
                    const { password, ...others } = User._doc;
                    res.status(200).json(others);
                })
                .catch(err => res.status(500).json(err));

        })
        .catch(err => res.status(500).json(err));
});


router.get("/getuser", verifytoken, async (req, res) => {
    try {
        const user = await User.findOne({ 'id': Number(req.query.id) });
        const { password, ...others } = user._doc;

        res.status(200).json(others);
    } catch (error) {
        res.status(500).json(error);
    }
});

router.get("/getallusers", verifytoken, async (req, res) => {
    try {
        const user = await User.find();
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json(error);
    }
});

router.post("/removefriend", verifytoken, async (req, res) => {
    let user1 = await User.findOne({ 'id': Number(req.query.id) });
    let user2 = await User.findOne({ 'id': Number(req.body.id) });
    try {
        user1.friends = user1.friends.filter((friend) => friend.id != user2.id);
        user2.friends = user2.friends.filter((friend) => friend.id != user1.id);
        user1.save();
        user2.save();
        res.status(200).json("friend removed");
    } catch (error) {
        return res.status(500).json(error);
    }
});



router.post('/resetpassword',verifytoken,async (req,res)=>{
    let newpassword=req.body.newpassword;
    let oldpassword=req.body.oldpassword;
    let user=await User.findOne({'id':Number(req.query.id)});
    try {
        if(cryptojs.AES.decrypt(user.password,process.env.PASS_SEC).toString(cryptojs.enc.Utf8)==oldpassword){
        user.password=cryptojs.AES.encrypt(newpassword,process.env.PASS_SEC).toString();
        user.save();
        const { password, ...others } = user._doc;
        res.status(200).json(others);
        }
        else{
            res.status(400).json("bad credentials");
        }
    }
    catch (error) {
        return res.status(500).json(error);
    }
});


module.exports = router