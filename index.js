require('dotenv').config()
const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })

app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
})

const User = mongoose.model('User', new mongoose.Schema({
  id: String,
  username: String
}))

const Exercise = mongoose.model('Exercise', new mongoose.Schema({
  id: String,
  description: String,
  duration: Number,
  date: Date
}))

app.post('/api/users', (req, res) => {
  const user = new User({
    username: req.body.username
  })

  user.save((err, data) => {
    if (err) return console.error(err)
    res.json({
      _id: data._id,
      username: data.username
    })
  })
})

app.get('/api/users', (req, res) => {
  User.find().sort({name: 1}).exec((err, data) => {
    if (err) return console.error(err)
    res.json(data)
  })
})

app.get('/api/users/:id', (req, res) => {
  User.findOne({_id: req.params.id}, (err, data) => {
    if (err) return console.error(err)
    res.json(data)
  })
})

app.post('/api/users/:_id/exercises', (req, res) => {
  const body = req.body
  const user = req.params._id

  User.findOne({_id: user}, (err, data) => {
    if (err) res.json({error: 'User not found'})
    
    const exercise = new Exercise({
      id: user,
      description: body.description,
      duration: body.duration,
      date: body.date
    })

    exercise.save((err, newRecord) => {
      if (err) return console.error(err)

      res.json({
        _id: newRecord.id,
        username: data.username,
        date: new Date(newRecord.date).toDateString(),
        duration: newRecord.duration,
        description: newRecord.description
      })
    })
  })
})

app.get('/api/users/:id/logs', (req, res) => {
  User.findOne({_id: req.params.id}, (err, data) => {
    if (err) return console.error(err)
    const user = data
    
    const criteria = {id: req.params.id}
    if (req.query.from != undefined && req.query.to != undefined) {
      criteria.date = {
        $gte: new Date(new Date(req.query.from).setHours(00, 00, 00)),
        $lt: new Date(new Date(req.query.to).setHours(23, 59, 59))
      }
    }
    const exercise = Exercise.find(criteria).sort({date: 1}).select({'description' : 1, 'duration' : 1, 'date' : 1, '_id' : 0})
    
    if (req.query.limit != undefined && req.query.limit > 0) exercise.limit(req.query.limit)
    exercise.exec((err, data) => {
      if (err) return console.error(err)
      const logs = []
      for(let i = 0; i < data.length; i++) {
        logs.push({
          description: data[i].description,
          duration: data[i].duration,
          date: new Date(data[i].date).toDateString()
        })
      }

      res.json({
        username: user.username,
        count: logs.length,
        _id: user._id,
        log: logs
      })
    })
  })


})


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
