require("dotenv").config();
const jwt = require("jsonwebtoken");
const redisClient = require("../config/redis");
const ErrorResponse = require("./ErrorResponse");

const generateRefreshToken = (userId, next) => {
    // create refreshToken
    const refreshToken = jwt.sign(
        { userId: userId },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRE,
        }
    );

    // save refreshToken (redis v4+ returns a promise)
    redisClient
        .set(userId.toString(), refreshToken)
        .then(() => console.log("Stored refreshToken"))
        .catch((err) => next(new ErrorResponse(err.message, 400)));

    return refreshToken;
};

module.exports = generateRefreshToken;
