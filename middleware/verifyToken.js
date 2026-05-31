const jwt = require("jsonwebtoken");
const ErrorResponse = require("../helpers/ErrorResponse");
const redisClient = require("../config/redis");

const verifyAcessToken = (req, res, next) => {
    const authHeader = req.header("Authorization");
    const token = authHeader && authHeader.split(" ")[1];

    // simple validate access token
    if (!token) {
        return next(new ErrorResponse("Access token not found", 401));
    }
    try {
        // verify access token
        const decodeToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        req.userId = decodeToken.userId;
        req.role = decodeToken.role;

        next();
    } catch (err) {
        console.log(err.message);
        return next(
            new ErrorResponse("Access token invalid or has expired", 401)
        );
    }
};

const verifyRefreshToken = async (req, res, next) => {
    const { refreshToken } = req.body;

    // simple validate refresh token
    if (!refreshToken) {
        return next(new ErrorResponse("Refresh token not found", 401));
    }

    try {
        // verify refresh token
        const decodeToken = jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );

        // redis v4+: get() returns a promise
        const redisClientRefreshToken = await redisClient.get(
            decodeToken.userId.toString()
        );

        // simple validate redisClientRefreshToken
        if (!redisClientRefreshToken) {
            return next(
                new ErrorResponse("Refresh token not found in redis", 401)
            );
        }
        // compare refreshToken vs redisClientRefreshToken
        if (refreshToken !== redisClientRefreshToken) {
            return next(
                new ErrorResponse(
                    "Refresh token not match with redis refresh token",
                    401
                )
            );
        }
        // all good
        req.userId = decodeToken.userId;

        next();
    } catch (err) {
        console.log(err.message);
        return next(
            new ErrorResponse("Refresh token invalid or has expired", 401)
        );
    }
};

const verifyResetToken = async (req, res, next) => {
    const { resetCode } = req.body;

    //validate reset code
    if (!resetCode) {
        return next(new ErrorResponse("Missing information", 400));
    }

    // check reset code (redis v4+ get() returns a promise)
    try {
        const redisUserId = await redisClient.get(resetCode.toString());
        if (!redisUserId) {
            return next(
                new ErrorResponse("Reset code not found or has expired", 404)
            );
        }

        req.userId = redisUserId;
        next();
    } catch (err) {
        return next(new ErrorResponse(err.message, 500));
    }
};
module.exports = { verifyAcessToken, verifyRefreshToken, verifyResetToken };
