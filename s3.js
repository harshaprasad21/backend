const AWS=require('aws-sdk');
// require('dotenv').config()
const fs=require('fs');
const path=require('path');
const uniqid=require('uniqid')
const awsBucketName=process.env.AWS_BUCKET_NAME
const awsRegionName=process.env.AWS_REGION
const awsAccessKey=process.env.AWS_ACCESS_KEY
const awsSecretKey=process.env.AWS_SECRET_KEY;

const s3Client=new AWS.S3({
    accessKeyId:awsAccessKey,
    secretAccessKey:awsSecretKey,
    region:awsRegionName
});

const uploadParams={
    Bucket:awsBucketName,
    Key:"",
    Body:null,
    // ACL:'public-read'
}

const s3={};
s3.s3Client=s3Client;
s3.uploadParams=uploadParams;


exports.doUpload=async function(file,folder,file_path=''){
    // console.log('file path -------',file_path)
    const s3Client=s3.s3Client;
    const params=s3.uploadParams;

    if(file_path){
        // console.log('deleted path called')
        doDelete(file_path)
    }
    // https://d9ztlfnqt2i1p.cloudfront.net/Development/image/g2pcc9g4lvxdmmci
    var file_path='/'+folder+'/'+uniqid();
    console.log("file_path",file_path);

    params.Key='Development' + file_path;
    params.Body=file;

    try {
        const stored=await s3Client.upload(params).promise();
        // console.log('stored ---------',stored)
        return file_path;
    } catch (err) {
        return err
    }
}

doDelete=async function (file_path){
    const s3Client=s3.s3Client;
    try {
        var params={Bucket:process.env.AWS_BUCKET_NAME,Key:'Development'+file_path};
        var res=await s3Client.deleteObject(params).promise();
        return res;
    } catch (error) {
        return error
    }
}


// https://d9ztlfnqt2i1p.cloudfront.net/Development/image/'image-name';