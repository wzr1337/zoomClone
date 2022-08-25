const express = require("express")
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)
const { v4: uuidV4 } = require('uuid')
const { ExpressPeerServer } = require('peer');
const cors = require('cors');

app.set('port', process.env.PORT || 3000);
app.set("io", io);
app.set('view engine', 'ejs')
app.use(cors());
app.use(express.static('./public'))

// use peer Server
const peerServer = ExpressPeerServer(server, {
  debug: true,
  path: 'peerjs',
  port: app.get('port')
});
// app.use('/peerjs', peerServer);


// answer default GETs
app.get('/', (req, res) => {
  res.redirect(`/rooms/${uuidV4()}`)
})
// respond to rooms
app.get('/rooms/:room', (req, res) => {
  res.render('room', {
    roomId: req.params.room
  })
})



const myServer = server.listen(app.get('port'), () => {
  console.log(`Server started at: http://${myServer.address().address}:${myServer.address().port}`)

  io.on('connection', socket => {
    socket.on('join-room', (roomId, userid) => {
      console.log(`roomId: ${roomId}, userId: ${userid} joined`)
      socket.join(roomId)
      // boradcast the newly connected users Id to every other user in the room
      socket.to(roomId).emit('user-connected', userid)

      socket.on('disconnect', () => {
        console.log(`roomId: ${roomId}, userId: ${userid} disconnected`)
        socket.to(roomId).emit('user-disconnected', userid)
      })
    })
  })
})