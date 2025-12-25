import mongoose from 'mongoose'

const connect=async (url) => {
    mongoose.connect(url)
    .then(()=>{
        console.log("Database connected")
    })
    .catch((err)=>{
        console.log(err)
    })

}
export default connect;