const cryptojs = require('crypto-js')
const { validationResult } = require('express-validator')

const { generateQuery, asyncQuery } = require('../helpers/queryHelp')
const { createToken } = require('../helpers/jwt')

const db = require('../database')

const CRYPTO_KEY = process.env.KEY

module.exports = {
    register: async (req, res) => {
        const { username, password, email } = req.body

        // validation input from user
        const errors = validationResult(req)
        if (!errors.isEmpty()) return res.status(400).send(errors.array()[0].msg)

        // encrypt password with crypto js
        // data yang sudah di encrypt oleh crypto js, TIDAK BISA di decrypt
        const hashpass = cryptojs.HmacMD5(password, CRYPTO_KEY).toString()
        // console.log('password : ', hashpass.toString())

        // create UID
        const UID = Date.now()

        try {
            // kalau tidak ada error, proses penambahan data user baru berjalan
            const checkUser = `SELECT * FROM users 
                              WHERE username=${db.escape(username)}
                              OR email=${db.escape(email)}`
            const resCheck = await asyncQuery(checkUser)

            if (resCheck.length !== 0) return res.status(400).send('Username or Email is already exist')

            const regQuery = `INSERT INTO users (uid, username, email, password)
                              VALUES (${db.escape(UID)}, ${db.escape(username)}, ${db.escape(email)}, ${db.escape(hashpass)})`
            const resRegister = await asyncQuery(regQuery)

            // create token
            const token = createToken({ uid: UID, role: 'user' })

            res.status(200).send({ id: resRegister.insertId, uid: UID, username, email, token })
        }
        catch (err) {
            console.log(err)
            res.status(400).send(err)
        }
    },
    login: async (req, res) => {
        const { email, username, password } = req.body
        try {
            // check username or email
            const QUERY = email ? `email = ${db.escape(email)}` : `username = ${db.escape(username)}`
            const CHECK = `SELECT * FROM users WHERE ` + QUERY
            const userQuery = await asyncQuery(CHECK)

            if (userQuery.length === 0) return res.status(404).send('user doesn\'t found.')

            // check user password
            const hashpass = cryptojs.HmacMD5(password, CRYPTO_KEY).toString()
            if (hashpass !== userQuery[0].password) return res.status(404).send('incorrect password.')

            // check user status
            // # deactive == 2
            if (userQuery[0].status === 2) return res.status(401).send('this account doesn\'t active.')
            // # closed == 3
            if (userQuery[0].status === 3) return res.status(401).send('this account has been closed.')

            // create token
            userQuery[0].token = createToken({ uid: userQuery[0].uid, role: userQuery[0].role })

            // send response to client side
            delete userQuery[0].password
            res.status(200).send(userQuery[0])
        } catch (err) {
            console.log(err)
            res.status(400).send(err)
        }
    },
    deactivate: async (req, res) => {
        const { uid } = req.user

        try {
            // deactive user account
            const DEACTIVE = `UPDATE users SET status = 2 WHERE uid = ${db.escape(uid)}`
            await asyncQuery(DEACTIVE)

            // send response to client side
            res.status(200).send({ uid: uid, status: 'deactive' })

        } catch (err) {
            console.log(err)
            res.status(400).send(err)
        }
    },
    activate: async (req, res) => {
        const { uid } = req.user
        try {
            // check user status before activation
            const CHECK = `SELECT * FROM users WHERE uid = ${db.escape(uid)}`
            const USER = await asyncQuery(CHECK)
            if (USER[0].status == 3) res.status(401).send('sorry this account has been closed.')

            // activate user account
            const ACTIVE = `UPDATE users SET status = 1 WHERE uid = ${db.escape(uid)}`
            await asyncQuery(ACTIVE)

            // send response to client side
            res.status(200).send({ uid: uid, status: 'active' })
        } catch (err) {
            console.log(err)
            res.status(400).send(err)
        }
    },
    closed: async (req, res) => {
        const { uid } = req.user
        try {
            // close user account
            const CLOSE = `UPDATE users SET status = 3 WHERE uid = ${db.escape(uid)}`
            await asyncQuery(CLOSE)

            // send response to client side
            res.status(200).send({ uid: uid, status: 'closed' })
        } catch (error) {
            console.log(err)
            res.status(400).send(err)
        }
    }
}