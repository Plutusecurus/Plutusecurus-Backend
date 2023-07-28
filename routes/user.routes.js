const express = require('express');
const multer = require('multer');

const { body } = require('express-validator')
const userController = require('../controllers/user.controller')

const upload = multer({ dest: 'uploads/' });
const validator = require('validator');
const isAuth = require('../middlewares/is-auth');

const userRouter = express.Router();

userRouter.post(
    '/register',
    upload.single('profilePic'),
    [
        body('account').custom((value) => {
            if (!validator.isEthereumAddress(value)) {
              throw new Error('Invalid Ethereum wallet public address');
            }
            return true;
        }),
        body('password').trim().isLength({min:6}).withMessage('Password should be atleast 6 characters long.'),
        body('name').trim().not().isEmpty().withMessage('Supplier Name cannot be empty.'),
        body('upiID').trim().not().isEmpty().withMessage('upiID cannot be empty.')
    ],
    userController.registerUser
);

userRouter.post(
    '/login',
    [
        body('account').custom((value) => {
            if (!validator.isEthereumAddress(value)) {
              throw new Error('Invalid Ethereum wallet public address');
            }
            return true;
        }),
        body('password').trim().isLength({min:6}).withMessage('password should be atleast 6 characters long.')
    ],
    userController.loginUser
)

userRouter.get('/:address', userController.getUserById);

userRouter.post('/add-expense', userController.addExpense);

userRouter.post('/add-income', userController.addIncome);

userRouter.post('/addINRToWallet', isAuth, userController.addINRToWallet);

userRouter.post('/transactions', userController.getAllTransactions);

userRouter.post('/createRazorpayPaymentOrder', userController.createRazorpayPaymentOrder);

userRouter.post('/createETHtoINROrder', userController.createETHtoINROrder)

userRouter.post('/convertINRtoETH', userController.convertINRtoETH)

module.exports = userRouter;