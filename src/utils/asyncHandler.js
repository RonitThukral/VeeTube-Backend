
const asyncHandler = (func) => 
    {
        async (req, res, next) => {
    try {

       await func(req, res, next)
        
    } catch (error) {
        res.status(error.code || 500).json({
            success: false,
            message: error.message
        })
    }
}
}



//alternate version

// const asyncHandler2 = (requestHandler) => {
//     Promise.resolve(requestHandler(req,res,next))
//     .catch( (error) => next(error))
// }

export {asyncHandler}