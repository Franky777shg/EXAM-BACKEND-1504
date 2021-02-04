const { generateQuery, asyncQuery } = require('../helpers/queryHelp')
const db = require('../database')

const GET_MOVIES = `SELECT 
                    mv.name, 
                    mv.release_date, 
                    mv.release_month, 
                    mv.release_year, 
                    mv.duration_min,
                    mv.genre,
                    mv.description,
                    ms.status,
                    lc.location,
                    st.time
                    FROM movies mv
                    JOIN movie_status ms ON ms.id = mv.status
                    JOIN schedules sc ON sc.movie_id = mv.id
                    JOIN locations lc ON lc.id = sc.location_id
                    JOIN show_times st ON st.id = sc.time_id `

module.exports = {
    getAllMovies: async (req, res) => {
        try {
            const result = await asyncQuery(`${GET_MOVIES} order by mv.name`)
            res.status(200).send(result)
        }
        catch (err) {
            console.log(err)
            res.status(400).send(err)
        }
    },
    getMovieList: async (req, res) => {
        const { status, location, time } = req.query
        try {
            // doing query filter
            let FILTER = 'WHERE ms.id != 3'
            FILTER += status ? ` AND ms.status = "${status}"` : ''
            FILTER += location ? ` AND lc.location = "${location}"` : ''
            FILTER += time ? ` AND st.time = "${time}"` : ';'

            // get data
            console.log(FILTER)
            console.log(GET_MOVIES + FILTER)
            const MOVIES = await asyncQuery(GET_MOVIES + FILTER)

            // send responsde to client side
            res.status(200).send(MOVIES)
        } catch (error) {
            console.log(err)
            res.status(400).send(err)
        }
    },
    AddMovie: async (req, res) => {
        try {
            const ADD_MOVIE = `INSERT INTO movies SET${generateQuery(req.body)}`
            // console.log(ADD_MOVIE)
            const MOVIE = await asyncQuery(ADD_MOVIE)

            // send request to client side
            res.status(200).send({ id: MOVIE.insertId, ...req.body })
            // res.status(200).send('test query')
        } catch (error) {
            console.log(err)
            res.status(400).send(err)
        }
    },
    ChangeStatus: async (req, res) => {
        const ID = parseInt(req.params.id)
        try {
            if (req.user.role !== 1) return res.status(400).send('Access Denied')

            const UPDATE_STATUS = `UPDATE movies SET status = ${db.escape(req.body.status)} WHERE id = ${ID}`
            await asyncQuery(UPDATE_STATUS)

            // send request to client side
            res.status(200).send({ id: ID, message: `status has been change.` })
        } catch (error) {
            console.log(err)
            res.status(400).send(err)
        }
    },
    SetSchedule: async (req, res) => {
        const ID = parseInt(req.params.id)
        delete req.body.token

        try {
            if (req.user.role !== 1) return res.status(400).send('Access Denied')

            const SET = `INSERT INTO schedules SET movie_id = ${db.escape(ID)},${generateQuery(req.body)}`
            console.log(SET)
            // await asyncQuery(SET)

            // send request to client side
            res.status(200).send({ id: ID, message: `schedule has been added.` })
        } catch (error) {
            console.log(err)
            res.status(400).send(err)
        }
    }
}