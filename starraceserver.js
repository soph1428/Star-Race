const express = require('express')
const app = express()
const http = require(`http`)
const server = http.createServer(app)
const {Server} = require(`socket.io`)
const io = new Server(server)
app.get(`/`, (req, res) => {
    res.sendFile(__dirname + "/starrace.html")
}); app.use(express.static(__dirname))
io.on(`connection`, (socket) => {
    socket.on("newUser", code => {
        var raceCode
        socket.join(code)
        socket.leave(socket.id)
        socket.on(`submitCode`, (otherCode, vehicle) => {
            if (otherCode == code) return
            if (!io.sockets.adapter.rooms.has(otherCode)) return socket.emit(`invalidCode`)
            if (!io.sockets.adapter.rooms.has(code)) return socket.emit(`waitForInviteResponse`)
            if (io.sockets.adapter.rooms.has(otherCode) && io.sockets.adapter.rooms.get(otherCode).size > 1) return socket.emit(`alreadyStarted`)
            io.in(otherCode).emit(`getVehicle`, vehicle)
            socket.leave(code)
            socket.join(otherCode)
            raceCode = otherCode
        }); socket.on(`getVehicle`, (vehicle, vehicle2, declined, setCode) => {
            if (setCode) raceCode = code
            else io.in(raceCode).emit(`joined`, vehicle, vehicle2, declined)
        }); socket.on(`moveVehicle`, (vehicle, attribute, value) => {
            io.in(raceCode).emit(`moveVehicle`, vehicle, attribute, value)
        }); socket.on(`joinDefaultRoom`, () => {socket.leave(raceCode); socket.join(code); raceCode = ``})
        socket.on(`rock`, rock => io.in(raceCode).emit(`rock`, rock))
        socket.on(`star`, star => io.in(raceCode).emit(`star`, star))
        socket.on(`earth`, (x, y) => io.in(raceCode).emit(`earth`, x, y))
        socket.on(`chatText`, text => io.in(raceCode).emit(`chatText`, text))
        socket.on(`disconnect`, () => disconnect(`Your opponent left the game.`))
        socket.on(`disconnected`, message => disconnect(message))
        function disconnect(message) {
            socket.leave(raceCode)
            if (io.sockets.adapter.rooms.get(raceCode)) {
                io.in(raceCode).emit(`disconnectedMessage`, message)
            }
        }
    })
}); server.listen(process.env.PORT || 5500, `127.0.0.1`, () => {
    console.log(`listening on 5500`)
})