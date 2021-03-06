const router = require('express').Router()
const express = require('express')
const db = require('../data/dbConfig.js')

const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const secret = require('../api/secrets.js').jwtSecret

router.post('/', (req, res) => {

  let user = req.body
  const hash = bcrypt.hashSync(user.password, 10)
  user.password = hash

  db('users').insert(user).then(saved => {
    res.status(201).json(saved)
  }).catch(err => {
    res.status(500).json(err)
  })
})

router.post('/login', (req, res) => {
  let {username, password} = req.body
  db('users').where({username})
    .first()
    .then(user => {
      if(user && bcrypt.compareSync(password, user.password)) {
        const token = generateToken(user)

        res.status(200).json({
          message: `Welcome ${user.username}`,
          token
        })
      } else {

        res.status(401).json({ message: 'Invalid Credentials' })
      }
    }).catch(err => {
      res.status(500).json(err)
    })
})

router.get('/', restricted, (req, res) => {
  db('users').then(users => {
    res.status(200).json(users)
  }).catch(err => {
    res.status(500).json(err)
  })
})

function generateToken(user) {
  const payload = {
    subject: user.id,
    username: user.username
  }

  const options = {
    expiresIn: '1d'
  }

  return jwt.sign(payload, secret, options)
}

function restricted(req, res, next) {
  const token = req.headers.authorization

  if(token) {
    jwt.verify(token, secret, (err, decodedToken) => {
      if(err) {
        res.status(401).json({ message: 'Invalid credentials' })
      } else {
        //token valid
        req.decodedJwt = decodedToken
        next()
      }
    })
  } else {
    res.status(401).json({ message: 'No token provided' })
  }
}

module.exports = router
