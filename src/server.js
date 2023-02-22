const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const path = require('path')
const dotenv = require('dotenv')

const app = express()
app.use(cors())
const server = require('http').Server(app)
const io = require('socket.io')(server)

io.on('connection', (socket) => {
  socket.on('connectRoom', (box) => {
    socket.join(box)
  })
})

/* mongoose.connect(
  'mongodb+srv://left-box:left-box@leftbox.wz7a73u.mongodb.net/?retryWrites=true&w=majority',
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
) */

dotenv.config()

mongoose.set('strictQuery', true)

mongoose
  .connect(process.env.MONGODB_ACCESS, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('connected to db')
  })
  .catch((err) => {
    console.log(err.message)
  })

app.use((req, res, next) => {
  req.io = io

  return next()
})

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use('/files', express.static(path.resolve(__dirname, '..', 'tmp')))

app.use(require('./routes'))

server.listen(3333, () => {
  console.log('Server started on port 3333!')
})
