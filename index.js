const express = require('express');
const app = express();
const cors = require('cors');
const dotenv = require("dotenv");
const userRoute = require("./routes/user");
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');


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
    socket.on('message',(data)=>{
        console.log(data);
    });
});
app.use("/api/user/", userRoute);

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
