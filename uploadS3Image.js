const AWS = require('aws-sdk');
var path = require('path');
var uniquid = require('uniqid');

const awsBucketName=process.env.AWS_BUCKET_NAME
const awsRegionName=process.env.AWS_REGION
const awsAccessKey=process.env.AWS_ACCESS_KEY
const awsSecretKey=process.env.AWS_SECRET_KEY;

const s3Client = new AWS.S3({
    accessKeyId:awsAccessKey,
    secretAccessKey:awsSecretKey,
    region:awsRegionName
})

const uploadParams = {
    Bucket:awsBucketName,
    Key:"",
    Body:null,
    // ACL:'public-read'
}

const s3 = {};

s3.s3Client = s3Client;
s3.uploadParams = uploadParams;

exports.uploadImageToS3 = async function (file, folder, file_path = '') {
    const s3Client = s3.s3Client;
    const params = s3.uploadParams;

    var file_path = '/' + folder + '/' + uniquid();
    // console.log('uploadImageToS3 file path', file_path);

    params.Key = 'Development' + file_path;
    params.Body = file;

    try {
        const stored = await s3Client.upload(params).promise();
        console.log('s3 uploaded file path---', file_path);
        return file_path;
    } catch (error) {
        console.error('Error uploading to S3:', error);
        return error;
    }
}
