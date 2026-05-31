const mongoose = require("mongoose");

// Prefer a full connection URI — works for both local (`mongodb://...`)
// and Atlas (`mongodb+srv://...`). Fall back to the old Atlas-style string
// built from the individual vars so existing setups keep working.
const getMongoUri = () => {
    if (process.env.MONGODB_URI) {
        return process.env.MONGODB_URI;
    }
    return `mongodb+srv://${process.env.MONGOBD_NAME}:${process.env.MONGOBD_PASSWORD}@learnmongo.lykg4.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
};

const connection = async () => {
    try {
        await mongoose.connect(getMongoUri());

        console.log("Connect successfully!");
    } catch (err) {
        console.log(err.message);
        console.log("Connect falure!");
    }
};

module.exports = connection;
