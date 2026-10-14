import mongoose from 'mongoose';

const connectDB = async ( req, res) => {
    try {
        await mongoose.connect( process.env.MONGO_URI)
        console.log('Connected to the database successfully')
    } catch (error) {
        console.log(" Error connecting to the database" , err)
        process.exit(1)
    }
}

export default connectDB;