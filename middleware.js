const jwt =require('jsonwebtoken')
const User=require('./usermodel.js');



const protector=async(req,res,next)=>{
    console.log(req)
    let token;
    token=req?.cookies?.new_cookie;
    console.log(token);
    
    if(token){
        try {
            const decode=await jwt.verify(token,process.env.JSON_WEB_TOKEN);
            req.user=await User.findById(decode.id).select('-password');
            next();
        } catch (error) {   
            res.status(404).json({message:'Not authorized,Invalid token'})
        }
    }else{
        res.status(404).json({message:'Not authorized,No token'})
    }
}

module.exports = {protector};