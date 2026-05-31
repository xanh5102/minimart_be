require("dotenv").config();
const ErrorResponse = require("./ErrorResponse");
const randomstring = require("randomstring");
const redisClient = require("../config/redis");

const generateResetCode = (userId, next) => {
    const resetCode = randomstring.generate({
        length: 6,
        charset: "alphanumeric",
        capitalization: "uppercase",
    });

    // redis v4+: expiry is passed via an options object ({ EX: seconds })
    redisClient
        .set(resetCode, userId.toString(), {
            EX: Number(process.env.RESET_CODE_EXPIRE),
        })
        .then(() => console.log("Generated reset code"))
        .catch((err) => next(new ErrorResponse(err.message, 500)));

    return resetCode;
};

module.exports = generateResetCode;
