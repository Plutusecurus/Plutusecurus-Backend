var mongoose = require('mongoose');

module.exports = async function connect() {

    try {
        const connectionParams = {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        }

        await mongoose.connect(process.env.MONGO_URI, connectionParams);

        console.log('DB connected successfully');
    } catch (error) {
        console.log(error);
        console.log('Could not connect to DB');
    }
}