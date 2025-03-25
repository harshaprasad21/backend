const mongoose=require('mongoose');


const connectDb=async()=>{
    try {
        const connect=await mongoose.connect(process.env.mongourl);
        console.log('***  Mongodb connected successfully ****');
    } catch (error) {
        console.log('error in db connection')
    }
}
exports.connectDb=connectDb;