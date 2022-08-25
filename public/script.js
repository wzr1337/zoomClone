const socket = io('/')
const videoGrid = document.getElementById('video-grid')

const myPeer = new Peer(undefined, {});

const myVideo = document.createElement('video')
myVideo.muted = true; // do not loopback own mic


// track active peers
const peers = {}

// connect own video 
navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
}).then( stream => {
  // add ego stream
  addVideoStream(myVideo, stream)

  // answer call
  myPeer.on('call', call => {
    call.answer(stream)
    const video = document.createElement('video')
    call.on('stream', userVideoStream => {
      addVideoStream(video, userVideoStream)
    })
  })
  
  // connect new users
  socket.on('user-connected', userId => {
    console.log('New user connected:', userId)
    connectToNewUser(userId, stream)
  })

  // remote userr disconnects
  socket.on('user-disconnected', userId => {
    console.log('user disconnected:', userId)
    if(peers[userId]) peers[userId].close()
  })
})


myPeer.on('open', peerId => {
  console.log(`joining room ${ROOM_ID} as user ${peerId}`)
  socket.emit('join-room', ROOM_ID, peerId);
})


function addVideoStream(video, stream) { 
  video.srcObject = stream
  video.addEventListener('loadedmetadata', () => {
    video.play() // start playback immediately
  })
  // append video to grid
  videoGrid.append(video)
}

function connectToNewUser(userId, stream) {
  const call = myPeer.call(userId, stream)
  const video = document.createElement('video')
  call.on('stream', userVideoStream => {
    addVideoStream(video, userVideoStream)
  })
  call.on('close', () => { // remove on closing connection
    video.remove()
  })

  peers[userId] = call
}