// import router from express
const router = require('express').Router()

// import controller
const { movieController } = require('../controllers')

// import helpers
const { verifyToken } = require('../helpers/jwt')

// create router
router.get('/get/all', movieController.getAllMovies)
router.get('/get', movieController.getMovieList)
router.post('/add', movieController.AddMovie)
router.patch('/edit/:id', verifyToken, movieController.ChangeStatus)
router.patch('/set/:id', verifyToken, movieController.SetSchedule)

// export router
module.exports = router