import { v2 as cloudinary } from 'cloudinary';
import { log } from 'console';
import fs from "fs";



    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET ,
    })


    const uploadOnCloudinary = async (localFilePath) => {
        try {
            //check if localFilePath is available or not
            if(!localFilePath) return null;

            //upload file on cloudinary
            const response = await cloudinary.uploader.upload(localFilePath, {
                resource_type: "auto"
            })

            //file has been uplaoded on cloudinary
            console.log("file is uplaoded on cloudinary successfully: ", response.url)

            return response;

        } catch (error) {

            fs.unlinkSync(localFilePath) // unlink the file saved temporarily in your own server
            return null;
            
        }
    }

    