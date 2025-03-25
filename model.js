const mongoose=require('mongoose');
const User=require('./usermodel.js')
const UrlSchema=mongoose.Schema({
    s3url:{
        type:String,
    },
    userRef:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User'
    }
})

const Url=mongoose.model('url',UrlSchema);
module.exports={Url:Url,User:User}
