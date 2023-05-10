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




function addlike(postid, userid) {
    Post.findOne({ id: postid }, (err, post) => {
        if (err) {
            console.log(err);
            io.emit('error');
        }
        else {
            let likes = post.likes;
            likes.push(userid);
            post.likes = likes;
            let temp;
            post.save()
                .then((post) => {

                    io.emit('likeadded', JSON.stringify(post));
                })
                .catch((err) => { io.emit('likeadded', "error"); });

        }

    });
}

function removelike(postid, userid) {
    Post.findOne({ id: postid }, (err, post) => {
        if (err) {
            console.log(err);
            io.emit('error');
        }
        else {
            let likes = post.likes;
            let index = likes.indexOf(userid);
            likes.splice(index, 1);
            post.likes = likes;
            post.save()
                .then((post) => {

                    io.emit('likeremoved', JSON.stringify(post));
                })
                .catch((err) => { io.emit('likeremoved', "error"); });

        }

    });
}

async function addcomment(postid, comment, userid,userimage) {
    let commentobj = {
        user: userid,
        userimage: userimage,
        comment: comment,
        replies: [],
    }
    let post = await Post.findOne({ id: postid });
    let comments = post.comments;
    comments.push(commentobj);
    post.comments = comments;
    post.save()
        .then((post) => {

            io.emit('commentadded', JSON.stringify(post));
        })
        .catch((err) => {io.emit('commentadded', "error"); });
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
        console.log(data);
        addlike(data.postid, data.userid);

    });
    socket.on('removelike', (data) => {
        console.log(data);
        removelike(data.postid, data.userid);

    });
    socket.on('addcomment', (data) => {
        console.log(data);
        addcomment(data.postid, data.comment, data.userid,data.userimage);
        // removelike(data.postid, data.userid);

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
// 1. feature to add profile picture for the user
// 2. feature to update the profile picture of the user
// 3. fix routing(if user is logged in then navigate to homepage else navigate to login page)
// 4. make user search page
// 5. make chat screen page
// 6. add post feature(connect to backend)
// 7. add like feature(connect to backend)
// 8. add comment feature(connect to backend)
// 9 . add unlike feature
// 10 add delete comment feature
// 11 add comment reply feature
// 12. show posts from the backend to the frontend
