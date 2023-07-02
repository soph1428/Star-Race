var socket = io.connect(`https://starrace.onrender.com`),
canvas = document.querySelector(`canvas`),
ctx = canvas.getContext(`2d`),
board = document.getElementById(`board`),
vehicleButton = document.getElementById(`vehicleButton`),
mainButtons = document.getElementById(`mainButtons`),
shopDiv = document.getElementById(`shopDiv`),
shopItems = [{src: `ufo1.png`, price: 500}, {src: `ufo2.png`, price: 750},
{src: `ufo3.png`, price: 1000}, {src: `vehicle5.png`, price: 1250},
{src: `vehicle6.png`, price: 1500}, {src: `vehicle7.png`, price: 1750},
{src: `vehicle8.png`, price: 2000}, {src: `vehicle9.png`, price: 2250},
{src: `vehicle10.png`, price: 2500}],
starbuxText = document.getElementById(`starbuxText`),
starbuxInnerHTML = starbuxText.innerHTML,
infoText = document.getElementById(`infoText`),
raceDiv = document.getElementById(`raceDiv`),
raceSettings = document.getElementById(`raceSettings`),
vehicles = document.getElementById(`vehicles`),
options = document.getElementById(`options`),
currentVehicle = document.getElementById(`currentVehicle`),
bottomVehicle = document.getElementById(`bottomVehicle`),
topVehicle = document.getElementById(`topVehicle`),
countdownTimeout, countdownInterval, rockInterval, rocks = [], stars = [],
moveAnimation, backgroundShiftX = 0, backgroundShiftY = 0,
countdown = document.getElementById(`countdown`),
defaultCountdownText = countdown.textContent,
code = Math.random().toString(36).substring(8),
chatText = document.getElementById(`chatText`),
defaultChatText = chatText.textContent,
chatInput = document.getElementById(`chatInput`),
raceInvite = document.getElementById(`raceInvite`),
acceptRace = document.getElementById(`acceptRace`),
declineRace = document.getElementById(`declineRace`)
shopItems.forEach(item => {
    document.getElementById(`shopItems`).innerHTML += `
    <div id="${item.src.replace(`.png`, ``)}Item" style="width: 40%; display: inline-block;">
        <img src="${item.src}" width="100" height="100"><br>
        <label style="font-size: 30px;"><i class="material-icons" style="font-size: 20px;">stars</i>${item.price}</label><br>
        <button class="${item.price}" style="background-color: lightblue; font-size: 30px;" onclick="buy(this)">Buy</button>
    </div>`
}); Array.from(document.querySelectorAll(`*`)).filter(elem => elem.tagName == `BUTTON` || elem.tagName == `LABEL` || elem.tagName == `INPUT`).forEach(elem => elem.style.fontFamily = `Monomaniac One`)
document.getElementById(`codeText`).textContent = `Your code: ${code}`
socket.emit(`newUser`, code)
bottomVehicle.src = currentVehicle.src
var backgroundImage = new Image()
backgroundImage.src = `starbackground.jpg`
console.log(backgroundImage.width, backgroundImage.height)
var backgroundX = -backgroundImage.width * 2,
backgroundY = -backgroundImage.height * 2,
backgroundWidth = backgroundImage.width * 5,
backgroundHeight = backgroundImage.height * 5,
earthImage = new Image(), earthX, earthY
earthImage.src = `earth.png`
updateStarbux(localStorage.getItem(`Starbux`) || 0)
updateVehicle(localStorage.getItem(`Vehicle`) || `vehicle1.png`)
updateVehicles()
function updateStarbux(amount) {
    if (Math.sign(amount) == -1) amount = 0
    localStorage.setItem(`Starbux`, amount)
    starbuxText.innerHTML = starbuxInnerHTML + amount
} function updateVehicle(src, optionClicked) {
    var previousSrc = currentVehicle.src
    currentVehicle.src = src
    bottomVehicle.src = src
    src = src.replace(location.href.slice(0, location.href.lastIndexOf(`/`) + 1), ``)
    localStorage.setItem(`Vehicle`, src)
    if (optionClicked) {
        updateVehicles(optionClicked.src)
        optionClicked.src = previousSrc
        updateVehicles(previousSrc, `add`)
    }
} function updateVehicles(src, action) {
    if (localStorage.getItem(`Vehicles`) == undefined) localStorage.setItem(`Vehicles`, ``)
    if (src) {src = src.replace(location.href.slice(0, location.href.lastIndexOf(`/`) + 1), ``)
        if (action == `add`) localStorage.setItem(`Vehicles`, localStorage.getItem(`Vehicles`) + `${src}, `)
        else localStorage.setItem(`Vehicles`, localStorage.getItem(`Vehicles`).replace(`${src}, `, ``))
        localStorage.setItem(`Vehicles`, localStorage.getItem(`Vehicles`).replaceAll(location.href.slice(0, location.href.lastIndexOf(`/`) + 1), ``))
    } if (vehicles.hidden) {
        Array.from(options.children).forEach(child => child.remove())
        for (var src of localStorage.getItem(`Vehicles`).split(`, `)) {
            if (src == ``) break
            var vehicle = document.createElement(`img`)
            vehicle.src = src
            vehicle.width = 150
            vehicle.height = 150
            vehicle.onclick = function() {
                updateVehicle(this.src, this)
            }; options.appendChild(vehicle)
        }
    } localStorage.setItem(`Vehicles Bought`, localStorage.getItem(`Vehicles`) + localStorage.getItem(`Vehicle`))
    for (var src of localStorage.getItem(`Vehicles Bought`).split(`, `)) {
        if (src == ``) break
        if (shopItems.some(item => item.src == src)) {
            var button = document.getElementById(src.replace(`.png`, ``) + `Item`).querySelector(`button`)
            inventory(button)
            if (src == localStorage.getItem(`Vehicle`)) inventory(button, `equip`)
        }
    }    
} function race() {clear()
    raceDiv.hidden = false
} function shop() {clear()
    shopDiv.hidden = false
} function changeVehicle() {clear()
    vehicles.hidden = false
} function clear() {
    Array.from(document.body.firstElementChild.children).forEach(child => child.hidden = true)
} function reset() {clear()
    mainButtons.hidden = false
} function submitCode(code, e) {
    if (e.key == `Enter` && code) socket.emit(`submitCode`, code, currentVehicle.src)
} socket.on(`joined`, (vehicle1, vehicle2, declined) => {
    if (declined && chatText.hidden) {
        if (currentVehicle.src == vehicle1) endRace(`They declined your race invitation.`)
        else endRace(``)
    } else {raceSettings.hidden = true
        raceInvite.hidden = true
        raceDiv.hidden = false
        countdown.hidden = false
        topVehicle.src = vehicle2
        topVehicle.hidden = false
        bottomVehicle.src = vehicle1
        chatText.hidden = false
        chatInput.hidden = false
        infoText.hidden = false
        chatInput.onkeyup = function(e) {
            if (e.key == `Enter` && chatInput.value.replaceAll(` `, ``)) socket.emit(`chatText`, chatInput.value)
        }; countdownTimeout = setTimeout(() => {
            countdown.style.fontSize = `${parseFloat(countdown.style.fontSize) + 50}px`
            countdown.textContent = 3
            countdownInterval = setInterval(() => {
                countdown.textContent = Number(countdown.textContent) - 1
                if (countdown.textContent == 0) {
                    clearInterval(countdownInterval)
                    countdown.hidden = true
                    board.hidden = true
                    ctx.resetTransform()
                    canvas.hidden = false
                    bottomVehicle.setAttribute(`data-x`, canvas.width / 2 - bottomVehicle.width / 2)
                    bottomVehicle.setAttribute(`data-moveXSpeed`, 8)
                    bottomVehicle.setAttribute(`data-xSpeed`, 0)
                    bottomVehicle.setAttribute(`data-y`, canvas.height / 2 + bottomVehicle.height / 2)
                    bottomVehicle.setAttribute(`data-moveYSpeed`, 8)
                    bottomVehicle.setAttribute(`data-ySpeed`, 0)
                    topVehicle.setAttribute(`data-x`, canvas.width / 2 - topVehicle.width / 2)
                    topVehicle.setAttribute(`data-moveXSpeed`, 8)
                    topVehicle.setAttribute(`data-xSpeed`, 0)
                    topVehicle.setAttribute(`data-y`, canvas.height / 2 - topVehicle.height * 1.5)
                    topVehicle.setAttribute(`data-moveYSpeed`, 8)
                    topVehicle.setAttribute(`data-ySpeed`, 0)
                    move()
                    if (bottomVehicle.src == currentVehicle.src) {
                        socket.emit(`earth`, Math.floor(Math.random() * ((backgroundWidth + backgroundX - 300) - (backgroundX + 300)) + (backgroundX + 300)), Math.floor(Math.random() * ((backgroundHeight + backgroundY - 300) - (backgroundY + 300)) + (backgroundY + 300)))
                        for (var i = 0; i < 30; i++) {
                            var starX = Math.floor(Math.random() * ((backgroundWidth + backgroundX - 300) - (backgroundX + 300)) + (backgroundX + 300))
                            var starY = Math.floor(Math.random() * ((backgroundHeight + backgroundY - 300) - (backgroundY + 300)) + (backgroundY + 300))
                            socket.emit(`star`, {image: `starcoin.png`, x: starX, y: starY, width: 50, height: 50})
                        } rockInterval = setInterval(() => {
                            var rockX = [Math.floor(Math.random() * ((backgroundWidth - 300) - (backgroundWidth + backgroundX + 300)) + (backgroundWidth + backgroundX + 300)), Math.floor(Math.random() * ((backgroundX - 300) - -backgroundWidth) + -backgroundWidth)][Math.floor(Math.random() * 2)]
                            var rockY = [Math.floor(Math.random() * ((backgroundHeight - 300) - (backgroundHeight + backgroundY + 300)) + (backgroundHeight + backgroundY + 300)), Math.floor(Math.random() * ((backgroundY - 300) - -backgroundHeight) + -backgroundHeight)][Math.floor(Math.random() * 2)]
                            socket.emit(`rock`, {image: [`rock1.png`, `rock2.png`, `rock3.png`][Math.floor(Math.random() * 3)], x: rockX, y: rockY, xSpeed: Math.floor(Math.random() * (4 - 1) + 1), ySpeed: Math.floor(Math.random() * (4 - 1) + 1), width: Math.floor(Math.random() * (151 - 25) + 25), height: Math.floor(Math.random() * (151 - 25) + 25)})
                        }, 500)
                    }
                }
            }, 1000);
        }, 4000)
    }
}); function buy(button) {
    if (parseFloat(localStorage.getItem(`Starbux`)) >= button.className) {
        updateStarbux(localStorage.getItem(`Starbux`) - button.className)
        updateVehicles(button.parentElement.querySelector(`img`).src, `add`)
        inventory(button)
    } else alert(`You don't have enough Starbux to buy this.`)
} function inventory(button, action) {
    if (action == `equip`) {
        button.textContent = `Equipped`
        button.onclick = ``
    } else {button.textContent = `Equip`
        button.onclick = function() {
            updateVehicle(this.parentElement.querySelector(`img`).src, Array.from(options.children).find(child => child.src == this.parentElement.querySelector(`img`).src))
            inventory(this, `equip`)
        }
    }
} socket.on(`getVehicle`, vehicle => {
    clear(); raceInvite.hidden = false
    socket.emit(`getVehicle`, false, false, false, true)
    currentVehicle.src = `copy${currentVehicle.src.slice(currentVehicle.src.lastIndexOf(`/`) + 1, currentVehicle.src.length)}`
    declineRace.onclick = function() {socket.emit(`getVehicle`, vehicle, currentVehicle.src, true)}
    acceptRace.onclick = function() {socket.emit(`getVehicle`, vehicle, currentVehicle.src)}
}); document.onkeydown = function(e) {
    if (!topVehicle.hidden && document.activeElement != chatInput) {
        var raceVehicle = bottomVehicle.src == currentVehicle.src ? bottomVehicle : topVehicle
        if (e.key.includes(`Arrow`)) e.preventDefault()
        if (e.key == `w` || e.key == `ArrowUp`) socket.emit(`moveVehicle`, raceVehicle.src, `data-ySpeed`, -raceVehicle.getAttribute(`data-moveYSpeed`))
        if (e.key == `s` || e.key == `ArrowDown`) socket.emit(`moveVehicle`, raceVehicle.src, `data-ySpeed`, raceVehicle.getAttribute(`data-moveYSpeed`))
        if (e.key == `a` || e.key == `ArrowLeft`) socket.emit(`moveVehicle`, raceVehicle.src, `data-xSpeed`, -raceVehicle.getAttribute(`data-moveXSpeed`))
        if (e.key == `d` || e.key == `ArrowRight`) socket.emit(`moveVehicle`, raceVehicle.src, `data-xSpeed`, raceVehicle.getAttribute(`data-moveXSpeed`))
    }
}; document.onkeyup = function(e) {
    if (!topVehicle.hidden) {
        var raceVehicle = bottomVehicle.src == currentVehicle.src ? bottomVehicle : topVehicle
        if (e.key == `w` || e.key == `ArrowUp` || e.key == `s` || e.key == `ArrowDown`) socket.emit(`moveVehicle`, raceVehicle.src, `data-ySpeed`, 0)
        if (e.key == `a` || e.key == `ArrowLeft` || e.key == `d` || e.key == `ArrowRight`) socket.emit(`moveVehicle`, raceVehicle.src, `data-xSpeed`, 0)
    }
}; function move() {
    moveAnimation = requestAnimationFrame(move)
    ctx.translate(backgroundShiftX, backgroundShiftY)
    ctx.clearRect(-backgroundImage.width * 10, -backgroundImage.height * 10, backgroundImage.width * 10, backgroundImage.height * 10)
    bottomVehicle.setAttribute(`data-x`, parseFloat(bottomVehicle.getAttribute(`data-x`)) + parseFloat(bottomVehicle.getAttribute(`data-xSpeed`)))
    bottomVehicle.setAttribute(`data-y`, parseFloat(bottomVehicle.getAttribute(`data-y`)) + parseFloat(bottomVehicle.getAttribute(`data-ySpeed`)))
    topVehicle.setAttribute(`data-x`, parseFloat(topVehicle.getAttribute(`data-x`)) + parseFloat(topVehicle.getAttribute(`data-xSpeed`)))
    topVehicle.setAttribute(`data-y`, parseFloat(topVehicle.getAttribute(`data-y`)) + parseFloat(topVehicle.getAttribute(`data-ySpeed`)))
    ctx.drawImage(backgroundImage, backgroundX, backgroundY, backgroundWidth, backgroundHeight)
    if (earthX != undefined) ctx.drawImage(earthImage, earthX, earthY, 300, 300)
    ctx.drawImage(bottomVehicle, bottomVehicle.getAttribute(`data-x`), bottomVehicle.getAttribute(`data-y`), bottomVehicle.width, bottomVehicle.height)
    ctx.drawImage(topVehicle, topVehicle.getAttribute(`data-x`), topVehicle.getAttribute(`data-y`), topVehicle.width, topVehicle.height)
    if (parseFloat(topVehicle.getAttribute(`data-x`)) > earthX - 100 && parseFloat(topVehicle.getAttribute(`data-x`)) < earthX + 100
    && parseFloat(topVehicle.getAttribute(`data-y`)) > earthY - 100 && parseFloat(topVehicle.getAttribute(`data-y`)) < earthY + 100) var hitVehicle = topVehicle
    if (parseFloat(bottomVehicle.getAttribute(`data-x`)) > earthX - 100 && parseFloat(bottomVehicle.getAttribute(`data-x`)) < earthX + 100
    && parseFloat(bottomVehicle.getAttribute(`data-y`)) > earthY - 100 && parseFloat(bottomVehicle.getAttribute(`data-y`)) < earthY + 100) var hitVehicle = bottomVehicle
    if (hitVehicle) {
        if (hitVehicle.src == currentVehicle.src) {
            socket.emit(`disconnected`, `You lost. Your opponent found Earth.`)
            endRace(`You win! You found Earth, Nice job!`)
        }
    } rocks.forEach((rock, i) => {
        var image = new Image()
        image.src = rock.image
        ctx.drawImage(image, rock.x, rock.y, rock.width, rock.height)
        rock.x += rock.xSpeed
        rock.y += rock.ySpeed
        if (rocks[i] == rock && ((rock.x > backgroundImage.width * 3 && Math.sign(rock.xSpeed) == 1) || (rock.x + rock.width < -backgroundImage.width && Math.sign(rock.xSpeed) == -1)
        || (rock.y > backgroundImage.height * 3 && Math.sign(rock.ySpeed) == 1) || (rock.y + rock.height < -backgroundImage.height && Math.sign(rock.ySpeed) == -1))) rocks.splice(i, 1)
        if (parseFloat(topVehicle.getAttribute(`data-x`)) + topVehicle.width > rock.x && parseFloat(topVehicle.getAttribute(`data-x`)) < rock.x + rock.width
        && parseFloat(topVehicle.getAttribute(`data-y`)) + topVehicle.height > rock.y && parseFloat(topVehicle.getAttribute(`data-y`)) < rock.y + rock.height) var hitVehicleRock = topVehicle
        if (parseFloat(bottomVehicle.getAttribute(`data-x`)) + bottomVehicle.width > rock.x && parseFloat(bottomVehicle.getAttribute(`data-x`)) < rock.x + rock.width
        && parseFloat(bottomVehicle.getAttribute(`data-y`)) + bottomVehicle.height > rock.y && parseFloat(bottomVehicle.getAttribute(`data-y`)) < rock.y + rock.height) var hitVehicleRock = bottomVehicle
        if (hitVehicleRock) {
            hitVehicleRock.setAttribute(`data-moveXSpeed`, hitVehicleRock.getAttribute(`data-moveXSpeed`) - 0.0005 * ((rock.width + rock.height) / 2))
            hitVehicleRock.setAttribute(`data-moveYSpeed`, hitVehicleRock.getAttribute(`data-moveXSpeed`))
            if (Math.round(hitVehicleRock.getAttribute(`data-moveXSpeed`)) == 0) {
                hitVehicleRock.setAttribute(`data-xSpeed`, 0)
                hitVehicleRock.setAttribute(`data-ySpeed`, 0)
                if (currentVehicle.src == hitVehicleRock.src) {
                    socket.emit(`disconnected`, `You win! Your opponent was hit too many times.`)
                    endRace(`You lost. You were hit too many times.`)
                }
            }
        }
    }); stars.forEach((star, i) =>  {
        var image = new Image()
        image.src = star.image
        ctx.drawImage(image, star.x, star.y, star.width, star.height)
        if (parseFloat(topVehicle.getAttribute(`data-x`)) + topVehicle.width > star.x && parseFloat(topVehicle.getAttribute(`data-x`)) < star.x + star.width
        && parseFloat(topVehicle.getAttribute(`data-y`)) + topVehicle.height > star.y && parseFloat(topVehicle.getAttribute(`data-y`)) < star.y + star.height) var hitVehicleStar = topVehicle
        if (parseFloat(bottomVehicle.getAttribute(`data-x`)) + bottomVehicle.width > star.x && parseFloat(bottomVehicle.getAttribute(`data-x`)) < star.x + star.width
        && parseFloat(bottomVehicle.getAttribute(`data-y`)) + bottomVehicle.height > star.y && parseFloat(bottomVehicle.getAttribute(`data-y`)) < star.y + star.height) var hitVehicleStar = bottomVehicle
        if (hitVehicleStar) {
            if (stars[i] == star) stars.splice(i, 1)
            hitVehicleStar.setAttribute(`data-moveXSpeed`, parseFloat(hitVehicleStar.getAttribute(`data-moveXSpeed`)) + 0.5)
            hitVehicleStar.setAttribute(`data-moveYSpeed`, hitVehicleStar.getAttribute(`data-moveXSpeed`))
            if (currentVehicle.src == hitVehicleStar.src) {
                updateStarbux(parseFloat(localStorage.getItem(`Starbux`)) + 50)
            }
        }
    })
} socket.on(`moveVehicle`, (vehicle, attribute, value) => {
    vehicle = vehicle == bottomVehicle.src ? bottomVehicle : topVehicle
    vehicle.setAttribute(attribute, value)
    if (currentVehicle.src == vehicle.src) {
        backgroundShiftX = attribute.includes(`x`) ? -value : backgroundShiftX
        backgroundShiftY = attribute.includes(`y`) ? -value : backgroundShiftY
    }
}); socket.on(`disconnectedMessage`, (message) => {
    if (!raceInvite.hidden || !raceSettings.hidden) message = `They disconnected.`
    endRace(message)
}); function endRace(message) {
    cancelAnimationFrame(moveAnimation)
    clearTimeout(countdownTimeout)
    clearInterval(countdownInterval)
    clearInterval(rockInterval)
    socket.emit(`joinDefaultRoom`), raceDiv.hidden = false
    canvas.hidden = true, topVehicle.hidden = true
    chatText.hidden = true, chatInput.hidden = true
    chatText.textContent = defaultChatText, chatInput.value = ``, infoText.hidden = true
    countdown.textContent = defaultCountdownText, currentVehicle.src = currentVehicle.src.replace(`copy`, ``)
    bottomVehicle.src = currentVehicle.src, bottomVehicle.hidden = false
    rocks = [], backgroundShiftX = 0, backgroundShiftY = 0
    countdown.hidden = true, raceSettings.hidden = false
    countdown.style.fontSize = countdown.getAttribute(`data-defaultFontSize`)
    raceInvite.hidden = true, board.hidden = false
    if (message.includes(`lost`) || message.includes(`win`)) updateStarbux(parseFloat(localStorage.getItem(`Starbux`)) + (message.includes(`lost`) ? -1 : 1) * 200)
    if (message) setTimeout(() => alert(message), 100)
} socket.on(`alreadyStarted`, () => alert(`This race has already started.`))
socket.on(`rock`, rock => {
    if (rock.x > canvas.width) rock.xSpeed = -rock.xSpeed
    if (rock.y > canvas.height) rock.ySpeed = -rock.ySpeed
    rocks.push({image: rock.image, x: rock.x, y: rock.y, xSpeed: rock.xSpeed, ySpeed: rock.ySpeed, width: rock.width, height: rock.height})
}); socket.on(`star`, star => stars.push(star))
socket.on(`chatText`, text => chatText.textContent = text)
socket.on(`invalidCode`, () => alert(`No player has that code.`))
socket.on(`waitForInviteResponse`, () => alert(`Wait for the other player to respond to your invite.`))
socket.on(`earth`, (x, y) => {earthX = x, earthY = y})