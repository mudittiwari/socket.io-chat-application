const jwt=require("jsonwebtoken");


function verifytoken(req,res,next)
{
    const authheader=req.headers.authorization;
    const token=authheader && authheader.split(' ')[1];
    if(authheader){
        jwt.verify(token,process.env.JWT_SEC,(err,user)=>{
            if(err)
            {
                return res.status(400).json(err);
            }
            else{
                req.user=user;
                next();
            }
        });
    }
    else
    {
        return res.status(400).json("not authenticated");
    }
}

module.exports={verifytoken};