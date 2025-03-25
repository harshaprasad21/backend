const mongoose=require('mongoose');
const User = require('./usermodel');

const UploadS3Image=mongoose.Schema({
    s3Path:{
        type:String
    },
    userRef:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User'
    }
});


const UploadS3ImageToS3=mongoose.model('uploadimages',UploadS3Image);
module.exports={UploadS3ImageToS3:UploadS3ImageToS3,User:User};