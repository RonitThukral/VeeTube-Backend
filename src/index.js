import connectDB from "./db/index.js";


connectDB()
.then(() => {

    app.on("error" , (error) => {
        console.log("ERROR: ", error)
        throw error
    })

    app.listen(process.env.PORT || 8000 , () => {
        console.log(`Server is Running on port ${process.env.PORT}`)
    })
})
.catch((err) => {
    console.log("MongoDb connection FAILED !!! ", err)
})