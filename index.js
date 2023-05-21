const express = require('express');
const app = express();
const cors = require('cors');
const dotenv = require("dotenv");
const userRoute = require("./routes/user");
const postRouter = require("./routes/post");
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
const Post = require("./models/Post");
const User = require("./models/User");
const jwt = require("jsonwebtoken");
const { verifytoken } = require('./routes/verifyAcessToken');

let boolupdate = false;
function addlike(postid, userid) {
    Post.findOne({ id: postid }, (err, post) => {
        if (err) {
            console.log(err);
            io.emit('likeadded', "error");
            boolupdate = false;
        }
        else {
            let likes = post.likes;
            likes.push(userid);
            post.likes = likes;
            post.save()
                .then((post) => {
                    console.log(post);
                    io.emit('likeadded', JSON.stringify(post));
                    boolupdate = false;
                })
                .catch((err) => { console.log(err); io.emit('likeadded', "error"); boolupdate = false; });

        }

    });
}

function removelike(postid, userid) {
    Post.findOne({ id: postid }, (err, post) => {
        if (err) {
            console.log(err);
            io.emit('likeremoved', "error");
            boolupdate = false;
        }
        else {
            let likes = post.likes;
            let index = likes.indexOf(userid);
            likes.splice(index, 1);
            post.likes = likes;
            post.save()
                .then((post) => {

                    io.emit('likeremoved', JSON.stringify(post));
                    boolupdate = false;
                })
                .catch((err) => { console.log(err); io.emit('likeremoved', "error"); boolupdate = false; });

        }

    });
}

async function addcomment(postid, comment, userid, userimage, username) {
    let commentobj = {
        user: userid,
        userimage: userimage,
        username: username,
        comment: comment,
        replies: [],
    }
    try {
        let post = await Post.findOne({ id: postid });
        let comments = post.comments;
        comments.push(commentobj);
        post.comments = comments;
        post.save()
            .then((post) => {

                io.emit('commentadded', JSON.stringify(post));
                boolupdate = false;
            })
            .catch((err) => { io.emit('commentadded', "error"); boolupdate = false; });
    } catch (error) {
        io.emit('commentadded', "error"); boolupdate = false;
    }
}


async function sendreq(sender, receiver) {
    try {
        let user = await User.findOne({ id: sender });
        let requests = user.friendrequestssent;
        requests.push(receiver);
        user.friendrequestssent = requests;
        user.save()
            .then(async (userfinal) => {
                let user2 = await User.findOne({ id: receiver });
                let requests = user2.friendrequestsreceived;
                requests.push(sender);
                user2.friendrequestsreceived = requests;
                user2.save().then((user2) => {
                    const { password, ...others } = userfinal._doc;
                    io.emit('reqsent', JSON.stringify(others));
                    boolupdate = false;
                }).catch((err) => {
                    console.log(err);
                    io.emit('reqsent', "error");
                    boolupdate = false;
                });
            })
            .catch((err) => {
                io.emit('reqsent', "error");
                boolupdate = false;
            });
    } catch (error) {
        io.emit('reqsent', "error");
        boolupdate = false;
    }
}

async function acceptreq(sender, receiver) {
    try {
        let user = await User.findOne({ id: receiver });
        let requests = user.friendrequestsreceived;
        requests.splice(requests.indexOf(sender), 1);
        user.friendrequestsreceived = requests;
        user.friends.push(sender);
        user.save()
            .then(async (user_) => {
                let user2 = await User.findOne({ id: sender });
                let requests = user2.friendrequestssent;
                requests.splice(requests.indexOf(receiver), 1);
                user2.friendrequestssent = requests;
                user2.friends.push(receiver);
                user2.save().then((userfinal) => {
                    console.log(user_);
                    const { password, ...others } = user_._doc;
                    io.emit('reqaccepted', JSON.stringify(others));
                    boolupdate = false;
                }).catch((err) => {
                    console.log(err);
                    io.emit('reqaccepted', "error");
                    boolupdate = false;
                });
            })
            .catch((err) => {
                io.emit('reqaccepted', "error");
                boolupdate = false;
            });
    } catch (error) {
        io.emit('reqaccepted', "error");
        boolupdate = false;
    }
}

// function verifytoken_(token)
// {

//         return jwt.verify(token,process.env.JWT_SEC,(err,user)=>{
//             // console.log(user);
//             if(err)
//             {
//                 return err;
//             }
//             else{
//                 return JSON.stringify(user);
//             }
//         });
// }




app.use(express.json());

dotenv.config();
mongoose.connect(process.env.MONGO_URL).then(() => {
    console.log("db connection successfully");
}).catch((e) => {
    console.log("mudit tiwari")
    console.log(e);
});

// app.use(cors({
// //   origin: 'https://mudittiwari.github.io'
// // origin:['https://singhpublication.in','https://mudittiwari.github.io']
//   origin: 'http://localhost:3000'
// }));
app.use(cors(
    {
        origin: 'http://localhost:3000',
    }
)
);
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST', 'DELETE', 'PUT']
    }
});


const usersmap = {};
io.on('connection', (socket) => {
    io.emit('senddetails', '');
    // this function is called when a pre-logged in user joins the website
    socket.on('details', (data) => {
        if (data.email && !usersmap.hasOwnProperty(data.email)) {
            boolupdate = true;
            usersmap[data.email] = socket.id;
            // console.log(usersmap);
        }
        else if(usersmap.hasOwnProperty(data.email)) {
            console.log("user already saved");
        }
        else {
            console.log("error");
        }
        console.log(usersmap);
    });
    //this function is called when a new logged in user joins the website
    socket.on('newlogin', (data) => {
        if (data.email && !usersmap.hasOwnProperty(data.email)) {
            boolupdate = true;
            usersmap[data.email] = socket.id.toString();
        }
        else {
            console.log("error");
        }
        console.log(usersmap);
    });
    socket.on('addlike', (data) => {
        if (!boolupdate) {
            boolupdate = true;
            console.log(data);
            addlike(data.postid, data.userid);

        }
    });
    socket.on('removelike', (data) => {
        if (!boolupdate) {
            boolupdate = true;
            console.log(data);
            removelike(data.postid, data.userid);
        }

    });
    socket.on('addcomment', (data) => {
        if (!boolupdate) {
            boolupdate = true;
            console.log(data);
            addcomment(data.postid, data.comment, data.userid, data.userimage, data.username);
        }
    });
    socket.on('sendreq', (data) => {
        if (!boolupdate) {
            boolupdate = true;
            sendreq(data.user, data.id);
        }
    });
    socket.on('acceptreq', (data) => {
        if (!boolupdate) {
            boolupdate = true;
            console.log(data);
            acceptreq(data.id, data.user);
        }
    });
    socket.on('disconnect', () => {
        for (const key in usersmap) {
            if (usersmap[key] === socket.id.toString()) {
                delete usersmap[key];  
                console.log(key+" disconnected");
                break;
            }
        }
    });
    // socket.on('message', (data) => {
    //     console.log(data);
    // }
    // );
});
app.use("/api/user/", userRoute);
app.use("/api/post/", postRouter);

server.listen(5000, () => {
    console.log('listening on port 5000');
}
);

// next steps in this project:
// 3. fix routing(if user is logged in then navigate to homepage else navigate to login page)
// 5. make chat screen page
// 10 add delete comment feature
// 11. make friends request page working
// 13. make profile page or other users
// 15. send notifications on like,comment,friend request received,friend request accepted,message received
// 16. make notification page working
// 17. make chat page working
// 18.make functionality to delete sent requests,accepted requests,delete friends


// projects to make before trip:
// complete this project
// make a project to share files using socket.io
// make a project to implement video and audio calling feature using socket.io and webrtc
// make a ecommerce website using react and node.js and mongodb
// make my own portfolio website


// projects to make after coming back from trip:
// make a website to do audio and video editing
// make a game using socket.io and react.js
// make a website to do video streaming
// make a website for algorithm visualizer
// complete whatsapp web3.0 project
// implement nft in the game project


// user can be on different screens:
// 1. home screen
// 2. profile screen
// 3. search screen
// 4. notification screen
// 5. chat screen
// 6. friendrequests screen
// 7. edit profile screen
// on these pages i have to listen for add like socket event, add comment socket event,friend requests socket events