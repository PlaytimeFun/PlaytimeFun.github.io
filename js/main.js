var collisionCount = 0;
var clock;
var dino;
var stats;
var loader = new THREE.JSONLoader();
var camera, controls, scene, renderer;
var mapSize;
var UNITWIDTH = 90;
var UNITHEIGHT = 45;
var CATCHOFFSET = 120;
var DINOCOLLISIONDISTANCE = 55;
var PLAYERCOLLISIONDISTANCE = 20;
var DINOSCALE = 20;
var collidableObjects = [];
var position = new THREE.Vector3();
var totalCubesWide;

var controlsEnabled = false;

var moveForward = false;
var moveBackward = false;
var moveLeft = false;
var moveRight = false;

var gameOver = false;

var velocity = new THREE.Vector3();
var dinoVelocity = new THREE.Vector3();
var objects = [];

var dinoRightCollide, dinoLeftCollide;

var blocker = document.getElementById('blocker');
var instructions = document.getElementById('instructions');
var dinoAlert = document.getElementById('dino-alert');
var status = document.getElementById('status');
dinoAlert.style.display = 'none';






getPointerLock();
init();



// Get or release the pointer lock (mouse controls)
// This section can tweaked to remove browser specifics, but left them in to show it doesn't matter in UWP
function getPointerLock() {

    var havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;

    if (havePointerLock) {
        var element = document.body;
        var pointerlockchange = function (event) {
            if (document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element) {
                controlsEnabled = true;
                controls.enabled = true;

                blocker.style.display = 'none';

            } else {
                controls.enabled = false;

                blocker.style.display = '-webkit-box';
                blocker.style.display = '-moz-box';
                blocker.style.display = 'box';

                // If we lost the game and press ESC, reload the game
                if (gameOver) {
                    location.reload();
                }
                instructions.style.display = '';


            }

        };

        var pointerlockerror = function (event) {

            instructions.style.display = '';

        };

        // Listen for state change events
        document.addEventListener('pointerlockchange', pointerlockchange, false);
        document.addEventListener('mozpointerlockchange', pointerlockchange, false);
        document.addEventListener('webkitpointerlockchange', pointerlockchange, false);

        document.addEventListener('pointerlockerror', pointerlockerror, false);
        document.addEventListener('mozpointerlockerror', pointerlockerror, false);
        document.addEventListener('webkitpointerlockerror', pointerlockerror, false);

        instructions.addEventListener('click', function (event) {

            instructions.style.display = 'none';

            // Ask the app/browser to lock the pointer
            element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
            element.requestPointerLock();

        }, false);

    } else {
        instructions.innerHTML = 'Pointer Lock API is not supported';
    }

}







function init() {
    
    
    // Add clock to keep track of frames
    clock = new THREE.Clock();
    // Add some fog
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0xcccccc, 0.002);

    // Set render settings
    renderer = new THREE.WebGLRenderer();
    renderer.setClearColor(scene.fog.color);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Render to the container
    var container = document.getElementById('container');
    container.appendChild(renderer.domElement);

    // Set camera position and view details
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 2000);
    camera.position.z = 0;
    camera.position.y = 20; // Height the camera will be looking from
    camera.position.x = 0;

    // Add the camera to the controller, then add to the scene
    controls = new THREE.PointerLockControls(camera);
    scene.add(controls.getObject());




    // Listen for when a key is pressed
    // If it's a specified key, mark the direction as true since moving
    var onKeyDown = function (event) {

        switch (event.keyCode) {

            case 38: // up
            case 87: // w
                moveForward = true;
                break;

            case 37: // left
            case 65: // a
                moveLeft = true;
                break;

            case 40: // down
            case 83: // s
                moveBackward = true;
                break;

            case 39: // right
            case 68: // d
                moveRight = true;
                break;


        }

    };

    // Listen for when a key is released
    // If it's a specified key, mark the direction as false since no longer moving
    var onKeyUp = function (event) {

        switch (event.keyCode) {

            case 38: // up
            case 87: // w
                moveForward = false;
                break;

            case 37: // left
            case 65: // a
                moveLeft = false;
                break;

            case 40: // down
            case 83: // s
                moveBackward = false;
                break;

            case 39: // right
            case 68: // d
                moveRight = false;
                break;

        }

    };

    // Add event listeners for when movement keys are pressed and released
    document.addEventListener('keydown', onKeyDown, false);
    document.addEventListener('keyup', onKeyUp, false);

    // Add the walls(cubes) of the maze
    createMazeWalls();
    // Add ground plane
    createGround();
    // Add boundry walls that surround the maze
    createBoundryWalls();



    // load the dino JSON model
    loader.load('./models/dino.json', function (geometry, materials) {
        var dinoObject = new THREE.Mesh(geometry, new THREE.MultiMaterial(materials));
        dinoObject.scale.set(DINOSCALE, DINOSCALE, DINOSCALE);
        dinoObject.rotation.y = degreesToRadians(180);
        dinoObject.position.set(30, 0, -400);
        dinoObject.name = "dino";
        scene.updateMatrixWorld(true);

        scene.add(dinoObject);
        //position.setFromMatrixPosition(dino.matrixWorld);
        dino = scene.getChildByName("dino");
        instructions.innerHTML = "<strong>Click to Play!</strong> </br></br> W,A,S,D = move </br>Mouse = look around";
        animate();


    });


    // Add lights to the scene
    light = new THREE.DirectionalLight(0xffffff);
    light.position.set(1, 1, 1);
    scene.add(light);

    light = new THREE.DirectionalLight(0xffffff, .4);
    light.position.set(1, -1, -1);
    scene.add(light);

    light = new THREE.AmbientLight(0x222222);
    scene.add(light);


    // Add frames per second monitor
    stats = new Stats();
    container.appendChild(stats.dom);

    // Listen for if the window changes sizes
    window.addEventListener('resize', onWindowResize, false);

}


// Create the maze walls using cubes that are mapped with a 2D array
function createMazeWalls() {
    // Maze wall mapping, assuming matrix
    // 1's are cubes, 0's are empty space
    var map = [
        [0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, ],
        [0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, ],
        [0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 1, 1, 1, 1, 0, 1, 1, 0, 0, ],
        [0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, ],
        [0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, ],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, ],
        [1, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, ],
        [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, ],
        [0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, ],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, ],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1, ],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, ],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 1, 0, 1, 0, 0, 1, 1, 1, ],
        [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, ],
        [0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 1, 1, 1, 0, 1, 0, 0, 0, 0, 0, ],
        [1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 0, 0, 0, 0, ],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, ],
        [1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, ],
        [0, 0, 1, 0, 1, 1, 1, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, ],
        [0, 0, 1, 2, 1, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, ]
    ];


    // wall details
    var wallGeo = new THREE.BoxGeometry(UNITWIDTH, UNITHEIGHT, UNITWIDTH);
    var wallMat = new THREE.MeshPhongMaterial({ color: 0x81cfe0, shading: THREE.FlatShading });

    // Used to keep cubes within boundry walls
    widthOffset = UNITWIDTH / 2;
    // Used to set cube on top of the place since a cube's position is at its center
    heightOffset = UNITHEIGHT / 2;

    totalCubesWide = map[0].length;

    // Place walls where `1`s are
    for (var i = 0; i < totalCubesWide; i++) {
        for (var j = 0; j < map[i].length; j++) {
            if (map[i][j]) {
                var wall = new THREE.Mesh(wallGeo, wallMat);
                wall.position.z = (i - totalCubesWide / 2) * UNITWIDTH + widthOffset;
                wall.position.y = heightOffset;
                wall.position.x = (j - totalCubesWide / 2) * UNITWIDTH + widthOffset;
                scene.add(wall);
                // Add cube to list of collidable objects
                collidableObjects.push(wall);
            }
        }
    }
}

// Create the ground plane that the maze sits on top of
function createGround() {
    // Create the ground based on the map size the matrix/cube size produced
    mapSize = totalCubesWide * UNITWIDTH;
    // ground
    var groundGeo = new THREE.PlaneGeometry(mapSize, mapSize);
    var groundMat = new THREE.MeshPhongMaterial({ color: 0xA0522D, side: THREE.DoubleSide, shading: THREE.FlatShading });

    var ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.set(0, 1, 0);
    ground.rotation.x = degreesToRadians(90);
    scene.add(ground);
}


// Make the four boundry walls for the maze
function createBoundryWalls() {
    var halfMap = mapSize / 2;
    var val = 1;
    // Create all boundry walls
    // i determines whether top/bottom or left/right walls are being created
    for (var i = 0; i < 2; i++) {
        // j determines which wall of the top/bottom or left/right pair is created
        for (var j = 1; j < 3; j++) {
            var wallGeom = new THREE.Geometry();
            var v1, v2, v3, v4;
            // Set vectors for top/bottom wall
            if (i == 0) {
                v1 = new THREE.Vector3(-(halfMap) * val, 0, -(halfMap) * val);
                v2 = new THREE.Vector3(halfMap * val, 0, -(halfMap) * val);
                v3 = new THREE.Vector3(halfMap * val, UNITHEIGHT, -(halfMap) * val);
                v4 = new THREE.Vector3(-(halfMap) * val, UNITHEIGHT, -(halfMap) * val);
                // Set vectors for left/right wall
            } else {
                v1 = new THREE.Vector3(-(halfMap) * val, 0, -(halfMap) * val);
                v2 = new THREE.Vector3(-(halfMap) * val, UNITHEIGHT, -(halfMap) * val);
                v3 = new THREE.Vector3(-(halfMap) * val, UNITHEIGHT, (halfMap) * val);
                v4 = new THREE.Vector3(-(halfMap) * val, 0, (halfMap) * val);
            }

            // Add verticies to the wall
            wallGeom.vertices.push(v1);
            wallGeom.vertices.push(v2);
            wallGeom.vertices.push(v3);
            wallGeom.vertices.push(v4);

            // Create the two triangle faces that make the wall shape
            wallGeom.faces.push(new THREE.Face3(0, 1, 2));
            wallGeom.faces.push(new THREE.Face3(0, 3, 2));

            // Add the wall to the scene
            var wall = new THREE.Mesh(wallGeom, new THREE.MeshPhongMaterial({ color: 0x464646, shading: THREE.FlatShading, side: THREE.DoubleSide }));
            scene.add(wall);
            // Add wall to collision detection
            collidableObjects.push(wall);
            val = -val;
        }
    }
}

// Update the camera and renderer when the window changes size
function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

}





function animate() {
    render();
    requestAnimationFrame(animate);
    var time = performance.now();
    // Get the change in time between frames
    var delta = clock.getDelta();
    // Update our frames per second monitor
    stats.update();

    // If the player is in dino's range, trigger the chase
    var isBeingChased = triggerChase();
    // If the player is too close, trigger the end of the game
    if (dino.position.distanceTo(controls.getObject().position) < CATCHOFFSET) {
        caughtAnimation();
    // Player is at an undetected distance
    // Keep the dino moving and let the player keep moving too
    } else {
        animateDino(delta);
        animatePlayer(delta);
    }

}

// Render the scene
function render() {
    TWEEN.update();
    renderer.render(scene, camera);

}

// Take a radian amount to rotate dino around its y axis by
function rotateAnimation(radianRotation) {
    console.log("collision count = " + collisionCount)

    if (dinoRightCollide && dinoLeftCollide) {
        console.log("going 180");
        radianRotation = degreesToRadians(180);
    } else if (dinoRightCollide) {
        console.log("going left");
        radianRotation = degreesToRadians(-90);
    } else if (dinoLeftCollide) {
        console.log("going right");
        radianRotation = degreesToRadians(90);
    }

    if (collisionCount > 3) {
        collisionCount = 0;
        new TWEEN.Tween(dino.position)
            .to(dino.position, 3000)
            .easing(TWEEN.Easing.Linear.None)
            .start();

    } else {

        new TWEEN.Tween(dino.rotation)
            .to({ y: dino.rotation.y + radianRotation }, 100)
            .easing(TWEEN.Easing.Linear.None)
            .onStart(function () {
                new TWEEN.Tween(dino.position)
                    .to(dino.position, 1000)
                    .easing(TWEEN.Easing.Linear.None)
                    .start();
            })
            .onComplete(function () {
                var rotation = radiansToDegrees(dino.rotation.y);


                dino.rotation.y = degreesToRadians(Math.floor(rotation / 90) * 90);

            })
            .start();
    }
}


// Make the dino chase the player
function triggerChase() {
    // Check if in dino agro range
    if (dino.position.distanceTo(controls.getObject().position) < 300) {
        // Adject the target's y value. We only care about x and z for movement.
        var lookTarget = new THREE.Vector3();
        lookTarget.copy(controls.getObject().position);
        lookTarget.y = dino.position.y;

        // Make dino face camera
        if (collisionCount < 20) {
            //console.log("Looking at you");
            dino.lookAt(lookTarget);
        } else {
            rotateAnimation(degreesToRadians(90));
        }

        // Get distance between dino and camera with a 120 unit offset
        // Game over when dino is the value of CATCHOFFSET units away from camera
        var distanceFrom = Math.round(dino.position.distanceTo(controls.getObject().position)) - CATCHOFFSET;
        // Alert and display distance between camera and dino
        dinoAlert.innerHTML = "Dino has spotted you! Distance from you: " + distanceFrom;
        dinoAlert.style.display = '';
        return true;
        // Not in agro range, don't start distance countdown
    } else {
        dinoAlert.style.display = 'none';
        return false;
    }
}


// Dino has caught the player. Turn on end prompt.
function caughtAnimation() {
    status.innerHTML = "GAME OVER </br></br></br> Press ESC to restart";
    gameOver = true;
    status.style.display = '';
    dinoAlert.style.display = 'none';
}



// Animate the player camera
function animatePlayer(delta) {
    // Gradual slowdown
    velocity.x -= velocity.x * 10.0 * delta;
    velocity.z -= velocity.z * 10.0 * delta;

    // If no collision and a movement key is being pressed, apply movement velocity
    if (detectPlayerCollision() == false) {
        if (moveForward) {
            velocity.z -= 500.0 * delta;
        }
        if (moveBackward) velocity.z += 500.0 * delta;
        if (moveLeft) velocity.x -= 500.0 * delta;
        if (moveRight) velocity.x += 500.0 * delta;

        controls.getObject().translateX(velocity.x * delta);
        controls.getObject().translateZ(velocity.z * delta);
    } else {
        // Collision or no movement key being pressed. Stop movememnt
        velocity.x = 0;
        velocity.z = 0;
    }
}


//  Determine if the player is colliding with a collidable object
function detectPlayerCollision() {
    // The rotation matrix to apply to our direction vector
    // Undefined by default to indicate ray should coming from front
    var rotationMatrix;
    // Get direction of camera
    var cameraDirection = controls.getDirection(new THREE.Vector3(0, 0, 0)).clone();

    // Check which direction we're moving (not looking)
    // Flip matrix to that direction so that we can reposition the ray
    if (moveBackward) {
        rotationMatrix = new THREE.Matrix4();
        rotationMatrix.makeRotationY(degreesToRadians(180));
    }
    else if (moveLeft) {
        rotationMatrix = new THREE.Matrix4();
        rotationMatrix.makeRotationY(degreesToRadians(90));
    }
    else if (moveRight) {
        rotationMatrix = new THREE.Matrix4();
        rotationMatrix.makeRotationY(degreesToRadians(270));
    }

    // Player is moving forward, no rotation matrix needed
    if (rotationMatrix !== undefined) {
        cameraDirection.applyMatrix4(rotationMatrix);
    }

    // Apply ray to player camera
    var rayCaster = new THREE.Raycaster(controls.getObject().position, cameraDirection);

    // If our ray hit a collidable object, return true
    if (rayIntersect(rayCaster, PLAYERCOLLISIONDISTANCE)) {
        return true;
    } else {
        return false;
    }

}

// Apply movement to the dino, turning when collisions are made
function animateDino(delta) {
    // Gradual slowdown
    dinoVelocity.x -= dinoVelocity.x * 10.0 * delta;
    dinoVelocity.z -= dinoVelocity.z * 10.0 * delta;


    // If no collision, apply movement velocity
    if (detectDinoCollision() == false) {
        dinoVelocity.z += 400.0 * delta;
        // Move the dino
        dino.translateZ(dinoVelocity.z * delta);

    } else {
        // Collision. Adjust direction
        var directionMultiples = [-1, 1, 2];
        var randomIndex = getRandomInt(0, 2);
        var randomDirection = degreesToRadians(90 * directionMultiples[randomIndex]);

        dinoVelocity.z += 400.0 * delta;
        rotateAnimation(randomDirection);
    }
}


// Determine whether ornot dino is colliding with a wall
function detectDinoCollision() {
    dinoLeftCollide = false;
    dinoRightCollide = false;

    // Get the rotation matrix from dino
    var matrix = new THREE.Matrix4();
    matrix.extractRotation(dino.matrix);
    // Create direction vectors
    var directionFront = new THREE.Vector3(0, 0, 1);
    var directionRight = new THREE.Vector3(-1, 0, 0);
    var directionLeft = new THREE.Vector3(1, 0, 0);
    // Get the vectors coming from the front, left, and right of dino
    directionFront.applyMatrix4(matrix);
    directionRight.applyMatrix4(matrix);
    directionLeft.applyMatrix4(matrix);

    // Create raycasters for each direction
    var rayCasterF = new THREE.Raycaster(dino.position, directionFront);
    var rayCasterR = new THREE.Raycaster(dino.position, directionRight);
    var rayCasterL = new THREE.Raycaster(dino.position, directionLeft);

    // See if the left and right rays are intersecting a collidable object
    dinoRighCollide = rayIntersect(rayCasterR, DINOCOLLISIONDISTANCE);
    dinoLeftCollide = rayIntersect(rayCasterL, DINOCOLLISIONDISTANCE);
    
    // If we have a front collision, we have to adjust our direction so return true
    if (rayIntersect(rayCasterF, DINOCOLLISIONDISTANCE))
        return true;
    else
        return false;

}

// Takes a ray and sees if it's colliding with anything from the list of collidable objects
// Returns true if certain distance away from object
function rayIntersect(ray, distance) {
    var intersects = ray.intersectObjects(collidableObjects);
    for (var i = 0; i < intersects.length; i++) {
        if (intersects[i].distance < distance) {
            return true;
        }
    }
    return false;
}

// Generate a random integer within a range
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
}

// Converts degrees to radians
function degreesToRadians(degrees) {
    return degrees * Math.PI / 180;
}

// Converts radians to degrees
function radiansToDegrees(radians) {
    return radians * 180 / Math.PI;
}

