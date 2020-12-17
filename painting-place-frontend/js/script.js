let scene, camera, renderer, socket

let playerObjects = {}

const EVENT_TYPES = {
    MOVEMENT: 'Movement',
    BRUSH_STROKE: 'MakeStroke'
}

function init() {
    // websocket
    socket = new WebSocket('ws://localhost:8000/ws')
    socket.onmessage = onSocketMessage

    // init THREE.js
    scene = new THREE.Scene()
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    
    renderer = new THREE.WebGLRenderer()
    renderer.setSize(window.innerWidth, window.innerHeight)
    document.body.appendChild(renderer.domElement)
          
    const planeGeometry = new THREE.PlaneGeometry(100, 100, 100, 100)
    const planeMaterials = [
        // white and black for checkerboard
        new THREE.MeshBasicMaterial( { color: 0xffffff, side: THREE.DoubleSide }),
        new THREE.MeshBasicMaterial( { color: 0x000000, side: THREE.DoubleSide })
    ]

    let l = planeGeometry.faces.length / 2
    for (let i = 0; i < l; i++) {
        let j = i * 2
        planeGeometry.faces[j].materialIndex = ((i + Math.floor(i/100)) % 2)
        planeGeometry.faces[j + 1].materialIndex = ((i + Math.floor(i/100)) % 2)
    }

    const plane = new THREE.Mesh(planeGeometry, planeMaterials)
    scene.add(plane)
    
    camera.rotateX(90)
    camera.position.z = 1
}

function sendEventToSocket(eventType, data) {
    socket.send(JSON.stringify({ type: eventType, ...data }))
}

function onSocketMessage(event) {
    let { sender, data } = JSON.parse(event.data)
    console.log(event)
    switch (data.type) {
        case EVENT_TYPES.MOVEMENT: {
            console.log("Drawing player") 
            let { x, y, z } = data
            if (playerObjects[sender]) {
                playerObjects[sender].position.x = x
                playerObjects[sender].position.y = y
                playerObjects[sender].position.z = z
            } else {
                const geometry = new THREE.SphereGeometry(1, 32, 32)
                const material = new THREE.MeshBasicMaterial({ color: 0xff0000 })
                const sphere = new THREE.Mesh(geometry, material)
                scene.add(sphere)
                playerObjects[sender] = sphere
            }
            break;
        }
        case EVENT_TYPES.BRUSH_STROKE: {
            console.log('Making stroke')
            let { x, y, z, size, color } = data
            makeStrokeElement(size, color, x, y, z)
            break;
        }
    }
}

let isMovingCamera = false
function onMouseDown() {
    isMovingCamera = true
}

let originalX = innerWidth / 2
let originalY = innerHeight / 2
function onMouseMove(event) {
    let x = event.clientX
    let y = event.clientY
    if (!isMovingCamera) {
        originalX = x
        originalY = y
        return
    }
    let xDiff = x - originalX
    let yDiff = y - originalY
    originalX = x
    originalY = y
    camera.rotateX(-yDiff / 100)
    camera.rotateY(-xDiff / 100)
}

function onMouseUp() {
    isMovingCamera = false
}

const keysPressed = {
    'w': false,
    'a': false,
    's': false,
    'd': false
}

function makeStrokeElement(size, color, x, y, z) {
    const geometry = new THREE.SphereGeometry(size, 32, 32)
    const material = new THREE.MeshBasicMaterial({ color })
    const sphere = new THREE.Mesh(geometry, material)
    
    sphere.position.x = x
    sphere.position.y = y
    sphere.position.z = z

    scene.add(sphere)
}

function makeStroke() {
    const position = camera.position.clone().add(camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(3))
    makeStrokeElement(0.5, 0xffff00, position.x, position.y, position.z)
    sendEventToSocket(
        EVENT_TYPES.BRUSH_STROKE,
        {
            x: position.x,
            y: position.y,
            z: position.z,
            size: 0.5,
            color: 0xffff00
        }
    )
}

function onKeyDown({ key }) {
    if (key == ' ') {
        makeStroke()
        return
    }

    if (keysPressed[key] != undefined) {
        keysPressed[key] = true
    }
}

function onKeyUp(event) {
    if (keysPressed[event.key] != undefined) {
        keysPressed[event.key] = false
    }
}

function onResize() {
    renderer.setSize(window.innerWidth, window.innerHeight)
}

function clamp(num, min, max) {
    return Math.min(Math.max(num, min), max)
}

function onMouseScroll(event) {
    camera.fov = clamp(camera.fov + event.deltaY, 10, 100)
    camera.updateProjectionMatrix()
}

// event listeners
document.addEventListener('mousedown', onMouseDown)
document.addEventListener('mousemove', onMouseMove)
document.addEventListener('mouseup', onMouseUp)
document.addEventListener('keydown', onKeyDown)
document.addEventListener('keyup', onKeyUp)
document.addEventListener('wheel', onMouseScroll)
document.addEventListener('resize', onResize)

// animate loop
function animate() {
    requestAnimationFrame(animate)
    let forward = camera.getWorldDirection(new THREE.Vector3()).divideScalar(10)

    // handle keypresses
    if (Object.values(keysPressed).some(key => key)) {
        if (keysPressed.w) {
            camera.position.add(forward)
        }
    
        if (keysPressed.s) {
            camera.position.add(forward.negate())
        }
    
        if (keysPressed.a) {
            let right = new THREE.Vector3(forward.z, forward.y, -forward.x)
            camera.position.add(right)
        }
    
        if (keysPressed.d) {
            let left = new THREE.Vector3(-forward.z, -forward.y, forward.x)
            camera.position.add(left)
        }

        sendEventToSocket(
            EVENT_TYPES.MOVEMENT,
            {
                x: camera.position.x,
                y: camera.position.y,
                z: camera.position.z
            }
        )
    }
    
    // render scene
    renderer.render(scene, camera)
}

init()
animate()