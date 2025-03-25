const express = require('express');
// const multer = require('multer');
require('dotenv').config()
const mongoose = require('mongoose')
const cors = require('cors');
const fileupload = require('express-fileupload')
const { doUpload } = require('./s3');
const { connectDb } = require('./db');
connectDb();
const app = express();
app.use(fileupload());
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
app.use(cookieParser());
app.use(cors({
    origin: 'https://3.19.207.123',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const Url = require('./model.js').Url;
const User = require('./usermodel.js');
const { protector } = require('./middleware.js');
const { UploadS3ImageToS3 } = require('./s3UploadModel.js');
const { uploadImageToS3 } = require('./uploadS3Image.js');
// const { protectorMiddleware } = require('./middleware.js');

require('dotenv').config();

const AWS = require('aws-sdk');

// Set the region and credentials
const awsRegionName = process.env.AWS_REGION || 'ap-south-1'; // Default to 'ap-south-1' if not set
const awsAccessKey = process.env.AWS_EMAIL_ACCESS_KEY;
const awsSecretKey = process.env.AWS_EMAIL_SECRET_KEY;

AWS.config.update({
region: awsRegionName,
accessKeyId: awsAccessKey,
secretAccessKey: awsSecretKey
});
// Create an instance of the SES servic
const ses = new AWS.SES({ apiVersion: '2012-10-17' });

app.post('/register', async (req, res) => {
    try {
        const { firstname, lastname, email, password } = req.body;
        if (!firstname || !lastname || !email || !password) {
            return res.status(400).json('Please fill all the fields')
        }
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(404).json('User already exists..Try with another email');
        }
        const user = await User.create({
            firstname,
            lastname,
            email,
            password
        });
        console.log(1111)
        console.log(2222)
        const params = {
            RawMessage: { // Specify raw message content
                Data: 'From: sharank0218@gmail.com\n' +
                      'To: ' + email + '\n' +
                      'Subject: Account Registration Confirmation\n' +
                      'Content-Type: text/plain; charset=UTF-8\n' +
                      '\n' +
                      'You have successfully created an account with us.'
            },
            Source: 'sharank0218@gmail.com' 
        };
        console.log(333)
        await ses.sendRawEmail(params).promise();
        if (user) {
            console.log(444)
            return res.status(200).json({ success: 'User created successfully', user })
        }
    } catch (error) {
        console.log(5555)
        console.error('Error:', error);
        console.log(6666)
        return res.status(500).json('Internal Server error ')
    }
});


//login user
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json('Cannot find a user');
        }
        if (user.password === password) {
            const token = jwt.sign({ id: user._id }, process.env.JSON_WEB_TOKEN);
            // console.log(req)
            res.cookie('new_cookie', token, { httpOnly: true }).status(201).json({ success: 'User logged in successfully', userdata: user });
        } else {
            return res.status(404).json({ failed: 'Password did not match..' });
        }
    } catch (error) {
        return res.status(500).json('Internal Server error - login');
    }
});

app.put('/update/:id', protector, async (req, res) => {
    try {
        const { firstname, lastname, email, password } = req.body;
        const updatedData = {
            firstname,
            lastname,
            email,
            password
        }

        if (!req.body) {
            return res.status(404).json('No Updated data found')
        }
        const userID = req.params.id;
        const updatedUser = await User.findByIdAndUpdate(userID, updatedData, { new: true });

        if (updatedUser) {
            return res.status(200).json({ sucess: 'user updated successfully', updatedUser })
        } else {
            return res.status(404).json({ error: 'User Not found' })
        }
    } catch (error) {
        return res.status(500).json({ error: 'Internal server Error' })
    }
})

//Upload image to the mongo and s3 bucket;

app.post('/upload/:_id?', protector, async (req, res) => {
    let fileId = req.params._id;
    // console.log(req);
    const userId = req?.user?._id;
    // console.log(userId);
    const user = await User.findById(userId);
    // console.log(user)
    if (!fileId) {
        fileId = new mongoose.Types.ObjectId();
    }
    const uploadedFile = req?.files?.file?.data;
    try {
        const dbFile = await Url.findOne({ _id: fileId });
        if (dbFile) {
            const updatedS3Url = await doUpload(uploadedFile, 'image', dbFile.s3url);
            await Url.updateOne({ _id: fileId }, { $set: { s3url: updatedS3Url, userRef: userId } });
            return res.json({ success: "File Updated Successfully", userid: fileId, s3url: updatedS3Url, userRef: user });
        } else {
            const newS3Url = await doUpload(uploadedFile, 'image');
            await Url.create({ _id: fileId, s3url: newS3Url, userRef: userId });
            return res.json({ success: "File Created Successfully", userid: fileId, s3url: newS3Url, userRef: user });
        }
    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});


app.get('/getS3Url', async (req, res) => {
    const userRefId = req.query.userRefId;
    try {
        const urls = await Url.find({ userRef: userRefId }).select('s3url _id');
        res.json(urls);
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


app.get('/getUserData', async (req, res) => {
    try {
        const userId = req?.query?.userId;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(400).json('Cannot find a user');
        }
        else {
            return res.status(200).json({ success: 'User data', user })
        }
    } catch (error) {
        res.status(500).json('Internal server Error- get user data', error)
    }
})

app.post('/logout', async (req, res) => {
    res.cookie('new_cookie', "", {
        httpOnly: true,
        expires: new Date(0)
    })
    return res.status(200).json({ message: 'User Logged out' })
})

app.post('/upload-s3-image', async (req, res) => {
    const userId = req?.query?.userId;

    const user = UploadS3ImageToS3({ userRef: userId })

    // console.log(req)
    const uploadedFile = req?.files?.file?.data
    console.log('uploaded file-----', uploadedFile);

    // console.log(user);

    if (user) {
        const resFromUploadedFile = await uploadImageToS3(uploadedFile, 'upload-image', user?.imgUrl);
        await UploadS3ImageToS3.create({
            s3Path: resFromUploadedFile,
            userRef: user.userRef
        })
        return res.status(200).json({ success: 'uploaded image to s3', s3Path: resFromUploadedFile, userRef: userId })
    }
});


app.get('/get-upload-image', async (req, res) => {
    const userId = req?.query?.userId;

    const getUserUploadedUrl = await UploadS3ImageToS3.find({ userRef: userId });
    if (getUserUploadedUrl) {
        return res.status(200).json({ success: 'get Uploaded file url successfull', getUserUploadedUrl })
    } else {
        return res.status(404).json('Cannot find a user to get Url')
    }
})

app.listen(3000, () => {
    console.log('Server running on port 3000');
});

