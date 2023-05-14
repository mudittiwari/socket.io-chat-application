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
            .then(async(userfinal) => {
                let user2 = await User.findOne({ id: receiver });
        let requests = user2.friendrequestsreceived;
        requests.push(sender);
        user2.friendrequestsreceived = requests;
        user2.save().then((user2)=>{
            io.emit('reqsent', JSON.stringify(userfinal));
            boolupdate = false;
        }).catch((err)=>{
            console.log(err);
            io.emit('reqsent', "error"); 
            boolupdate = false;
        });        
            })
            .catch((err) => { io.emit('reqsent', "error"); 
            boolupdate = false; });
    } catch (error) {
        io.emit('reqsent', "error"); 
        boolupdate = false;
    }
}

async function acceptreq(sender,receiver)
{
    try {
        let user = await User.findOne({ id: receiver });
        let requests = user.friendrequestsreceived;
        requests.splice(requests.indexOf(sender),1);
        user.friendrequestsreceived = requests;
        user.friends.push(sender);
        user.save()
            .then(async(user) => {
                let user2 = await User.findOne({ id: sender });
        let requests = user2.friendrequestssent;
        requests.splice(requests.indexOf(receiver),1);
        user.friendrequestssent = requests;
        user.friends.push(receiver);
        user2.save().then((userfinal)=>{
            io.emit('reqaccepted', JSON.stringify(userfinal));
            boolupdate = false;
        }).catch((err)=>{
            console.log(err);
            io.emit('reqaccepted', "error"); 
            boolupdate = false;
        });        
            })
            .catch((err) => { io.emit('reqaccepted', "error"); 
            boolupdate = false; });
    } catch (error) {
        io.emit('reqaccepted', "error"); 
        boolupdate = false;
    }
}

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

io.on('connection', (socket) => {
    console.log(socket.id);
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
        if(!boolupdate)
        {
            boolupdate = true;
            sendreq(data.user,data.id);
        }
    });
    socket.on('acceptreq', (data) => {
        if(!boolupdate)
        {
            boolupdate = true;
            acceptreq(data.user,data.id);
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
// 2. feature to update the profile picture of the user
// 3. fix routing(if user is logged in then navigate to homepage else navigate to login page)
// 5. make chat screen page
// 10 add delete comment feature
// 11. make friends request page working
// 12. make profile page working
// 13. make profile page or other users
// 14. make edit profile page working
// 15. send notifications on like,comment,friend request received,friend request accepted,message received
// 16. make notification page working
// 17. make chat page working
// 18.make functionality to delete sent requests,accepted requests,delete friends