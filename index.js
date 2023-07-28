var dotenv = require("dotenv")
dotenv.config()

var express = require('express');
var cors = require('cors');
const connect = require('./db.config');

const app = express();

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

connect();

const userRouter = require('./routes/user.routes');

app.get('/', (req, res) => {
    res.send('Server running for codebase: 28 July, 2023.');
});

app.use('/user', userRouter);

const port = 3000;

const server = app.listen(port, () => {
    console.log(`Server started listening to ${port}`);
});

const io = require('./utils/socket').init(server)
io.on('connection', (socket) => {
    console.log('Client connected!')
    const transactionController = require('./controllers/transaction.controller')

    socket.on('eth-to-eth', (data) => {
        transactionController.transactETHtoETH(data)
    })

    socket.on('inr-to-eth', (data) => {
        transactionController.transactINRtoETH(data)
    })
})