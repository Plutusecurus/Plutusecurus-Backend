const jwt = require('jsonwebtoken')
const dotenv = require('dotenv')
dotenv.config()

module.exports = (req, res, next) => {
    const authHeader = req.get('Authorization')
    if(!authHeader) {
        const error = new Error('Not Authenticated')
        error.statusCode = 401
        throw error
    }
    const token = authHeader.split(' ')[1]
    let decodedToken
    try {
        decodedToken = jwt.verify(token, process.env.JWT_SECRET)
    } catch(err) {
        err.statusCode = 500
        throw err
    }
    if(!decodedToken) {
        const error = new Error('Not Authenticated.')
        error.statusCode = 401
        throw error
    }
    req.publicAddress = decodedToken.address
    req.userId = decodedToken.userId
    next()
}