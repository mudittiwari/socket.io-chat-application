const router = require("express").Router();
const Post = require("../models/Post");
const {verifytoken}=require("../routes/verifyAcessToken");

router.post('/createpost', verifytoken, async (req, res) => {
    let { title, image,username,userimage } = req.body;
    let user = req.query.id;
    const post = new Post({
        title: title,
        image: image,
        user: user,
        username:username,
        userimage:userimage
    });
    try {
        const savedpost = await post.save();
        res.status(200).json(savedpost);
    }
    catch (err) {
        console.log(err);
        res.status(500).json(err);
    }
});


router.get('/getposts', verifytoken, async (req, res) => {
    let posts = await Post.find();
    res.status(200).json(posts);
});

router.delete('/deletepost', verifytoken, async (req, res) => {
    let postid = req.query.postid;
    Post.deleteOne({ 'id': postid }, (err, doc) => {
        if (err) {
            res.status(500).json({ "message": "Error deleting product" });
        } else {
            res.status(200).json({ "message": "Product deleted successfully" });
        }
    });
});

router.post('/addlike', verifytoken, async (req, res) => {
    let postid = req.body.postid;
    let userid = req.query.userid;
    try {
        let post = await Post.findOne({ id: postid });
    let likes = post.likes;
    likes.push(userid);
    post.likes = likes;
    post.save()
        .then(post => res.status(200).json(post))
        .catch(err => res.status(500).json(err));
    } catch (error) {
        res.status(500).json(error);
    }
});

router.post('/removelike', verifytoken, async (req, res) => {
    let postid = req.body.postid;
    let userid = req.query.userid;
    
    try {
        let post = await Post.findOne({ id: postid });
    let likes = post.likes;
        let index = likes.indexOf(userid);
    likes.splice(index, 1);
    post.likes = likes;
    post.save()
        .then(post => res.status(200).json(post))
        .catch(err => res.status(500).json(err));
    } catch (error) {
        res.status(500).json(error);
    }
});

router.post('/addcomment', verifytoken, async (req, res) => {
    let postid = req.body.postid;
    let comment = req.body.comment;
    let user = req.query.userid;
    let commentobj = {
        user: user,
        comment: comment,
        replies: [],
    }
    let post = await Post.findOne({ id: postid });
    let comments = post.comments;
    comments.push(commentobj);
    post.comments = comments;
    post.save()
        .then(post => res.status(200).json(post))
        .catch(err => res.status(500).json(err));
});

router.delete('/deletecomment', verifytoken, async (req, res) => {
    let postid = req.query.postid;
    let comment = req.body.comment;
    let user = req.body.userid;
    let post = await Post.findOne({ id: postid });
    let comments = post.comments;
    let index;
    for (let i = 0; i < comments.length; i++) {
        if (comments[i].comment == comment && comments[i].user == user) {
            index = i;
            break;
        }
    }
    try {
        comments.splice(index, 1);
        post.comments = comments;
        post.save()
            .then(post => res.status(200).json(post))
            .catch(err => res.status(500).json(err));
    } catch (error) {
        res.status(500).json(error);
    }
});


router.post('/addreply', verifytoken, async (req, res) => {
    let postid = req.query.postid;
    let comment = req.body.comment;
    let user = req.body.userid;
    let reply = req.body.reply;
    let userreplied = req.query.userreplied;
    let post = await Post.findOne({ id: postid });
    let comments = post.comments;
    let index;
    try {
        for (let i = 0; i < comments.length; i++) {
            if (comments[i].comment == comment && comments[i].user == user) {
                index = i;
                break;
            }
        }
        let replies = comments[index].replies;
        let replyobj = {
            user: userreplied,
            reply: reply,
        }
        replies.push(replyobj);
        comments[index].replies = replies;
        post.comments = comments;
        post.save()
            .then(post => res.status(200).json(post))
            .catch(err => res.status(500).json(err));
    } catch (error) {
        res.status(500).json(error);
    }
});

router.get('/getpost',verifytoken,async(req,res)=>{
    let postid=req.query.postid;
    try {
        let post=Post.find({id:postid});
        res.status(200).json(post);
    } catch (error) {
        res.status(500).json(error);
    }
});

module.exports = router;

// {
//     'comment':"cccccccccc",
//     'replies':[{'user':"user",'reply':'reply'},{},{}],
// }
