const { v2} = require ('cloudinary')
const dotenv = require ('dotenv')
dotenv.config({})
const cloudinary = v2
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET
})

module.exports = {cloudinary}