// import router from express
const router = require('express').Router()
const { body } = require('express-validator')

// import controller
const { userController } = require('../controllers')

// import helpers
const { verifyToken } = require('../helpers/jwt')

// register validation
const registerValidation = [
    body('username')
        .isLength({ min: 6 })
        .withMessage('Username must have 6 character'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password min 6 character')
        .matches(/[0-9]/)
        .withMessage('Password must include number')
        .matches(/[!@#$%^&*]/)
        .withMessage('Password must include symbol'),
    body('email')
        .isEmail()
        .withMessage('Invalid email')
]

// create router
router.post('/register', registerValidation, userController.register)
router.post('/login', userController.login)
router.patch('/deactive', verifyToken, userController.deactivate)
router.patch('/activate', verifyToken, userController.activate)
router.patch('/close', verifyToken, userController.closed)

// export router
module.exports = router