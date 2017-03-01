
var dino;
var stats;
var loader = new THREE.JSONLoader();
var camera, controls, scene, renderer;
var MAPSIZE, UNITWIDTH = 90;
var UNITHEIGHT = 45;
var collidableObjects = [];
var saveDino;
var position = new THREE.Vector3();

var controlsEnabled = false;

var moveForward = false;
var moveBackward = false;
var moveLeft = false;
var moveRight = false;

var turn;

var prevTime = performance.now();
var velocity = new THREE.Vector3();
var dinoVelocity = new THREE.Vector3();
var dinoPosition = new THREE.Vector3();
var objects = [];


var blocker = document.getElementById('blocker');
var instructions = document.getElementById('instructions');
var dinoAlert = document.getElementById('dino-alert');
dinoAlert.style.display = 'none';

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

			instructions.style.display = '';

		}

				};

				var pointerlockerror = function (event) {

		instructions.style.display = '';

				};

				// Hook pointer lock state change events
				document.addEventListener('pointerlockchange', pointerlockchange, false);
				document.addEventListener('mozpointerlockchange', pointerlockchange, false);
				document.addEventListener('webkitpointerlockchange', pointerlockchange, false);

				document.addEventListener('pointerlockerror', pointerlockerror, false);
				document.addEventListener('mozpointerlockerror', pointerlockerror, false);
				document.addEventListener('webkitpointerlockerror', pointerlockerror, false);

				instructions.addEventListener('click', function (event) {

		instructions.style.display = 'none';

		// Ask the browser to lock the pointer
		element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
		element.requestPointerLock();

				}, false);

} else {

				instructions.innerHTML = 'Your browser doesn\'t seem to support Pointer Lock API';

}






init();



// Take a radian amount to rotate dino around its y axis by
function rotateAnimation(radianRotation) {
	new TWEEN.Tween(dino.rotation)
		.to({ y: dino.rotation.y + radianRotation }, 100)
		.easing(TWEEN.Easing.Linear.None)
		.onStart(function () {
			new TWEEN.Tween(dino.position)
				.to(dino.position, 500)
				.easing(TWEEN.Easing.Linear.None)
				.start();
		})
		.onComplete(function () {
			var rotation = radiansToDegrees(dino.rotation.y);
			// Set rotation degrees back to 0 if going full circle
			if (rotation >= 360 || rotation <= -360) {
				rotation = 0;
			}

			// Set the rotation to the closest multiple of 90 degrees
			rotation = Math.floor(rotation);

			dino.rotation.y = degreesToRadians(Math.floor(rotation / 90) * 90);

		})
		.start();

}


function caughtAnimation() {
    var tar = dino.position.x;


    new TWEEN.Tween(dino.position)
		.to( dino.position , 0)
		.easing(TWEEN.Easing.Linear.None)
		//.onStart(function () {
		//    new TWEEN.Tween(controls.getObject().target.position)
        //        .to({ x: dino.position.x, y: dino.position.y, z: dino.position.z }, 1000)
        //        .easing(TWEEN.Easing.Linear.None)
        //        .start();
		//})
		//.onComplete(function () {
		//    //controls.getObject().lookAt(dino.position);

		//})
		.start();

}



function init() {

	scene = new THREE.Scene();
	scene.fog = new THREE.FogExp2(0xcccccc, 0.001);

	renderer = new THREE.WebGLRenderer();
	renderer.setClearColor(scene.fog.color);
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);

	var container = document.getElementById('container');
	container.appendChild(renderer.domElement);

	camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 2000);
	camera.position.z = 0;
	camera.position.y = 60;
	camera.position.x = 0;
	controls = new THREE.PointerLockControls(camera);
	scene.add(controls.getObject());

	var onKeyDown = function (event) {

		switch (event.keyCode) {

			case 38: // up
			case 87: // w
				moveForward = true;
				break;

			case 37: // left
			case 65: // a
				moveLeft = true; break;

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

				document.addEventListener('keydown', onKeyDown, false);
				document.addEventListener('keyup', onKeyUp, false);





	// Maze wall mapping, assuming matrix
	var map = [
		[0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0,],
		[0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0,],
		[0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 1, 1, 1, 1, 0, 1, 1, 0, 0,],
		[0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0,],
		[0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0,],
		[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0,],
		[1, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0,],
		[0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0,],
		[0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,],
		[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,],
		[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1,],
		[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0,],
		[0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 1, 0, 1, 0, 0, 1, 1, 1,],
		[0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0,],
		[0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 1, 1, 1, 0, 1, 0, 0, 0, 0, 0,],
		[1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 0, 0, 0, 0,],
		[0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,],
		[1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0,],
		[0, 0, 1, 0, 1, 1, 1, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0,],
		[0, 0, 1, 2, 1, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0,]
	];


	// wall details
	var geometry1 = new THREE.BoxGeometry(UNITWIDTH, UNITHEIGHT, UNITWIDTH);
	var material1 = new THREE.MeshPhongMaterial({ color: 0x81cfe0, shading: THREE.FlatShading });

	WIDTHOFFSET = UNITWIDTH / 2;
	HEIGHTOFFSET = UNITHEIGHT / 2;
	var totalCubesWide = map[0].length;
	// Place walls where `1`s are
	for (var i = 0; i < totalCubesWide; i++) {
		for (var j = 0; j < map[i].length; j++) {
			if (map[i][j]) {
				var wall = new THREE.Mesh(geometry1, material1);
				wall.position.z = (i - totalCubesWide / 2) * UNITWIDTH + WIDTHOFFSET;
				wall.position.y = HEIGHTOFFSET;
				wall.position.x = (j - totalCubesWide / 2) * UNITWIDTH + WIDTHOFFSET;
				scene.add(wall);
				collidableObjects.push(wall);
			}
		}
	}

	MAPSIZE = totalCubesWide * UNITWIDTH;
	// ground
	var geometry = new THREE.PlaneGeometry(MAPSIZE, MAPSIZE);
	var material = new THREE.MeshPhongMaterial({ color: 0xA0522D, side: THREE.DoubleSide, shading: THREE.FlatShading });

	var ground = new THREE.Mesh(geometry, material);
	ground.position.set(0, 1, 0);
	ground.rotation.x = degreesToRadians(90);
	scene.add(ground);


	createBoundryWalls();



	// load the dino JSON model
	loader.load('./models/dino.json', function (geometry, materials) {
	    var dinoObject = new THREE.Mesh(geometry, new THREE.MultiMaterial(materials));
	    dinoObject.scale.set(20, 20, 20);
	    dinoObject.rotation.y = degreesToRadians(15);
	    dinoObject.position.set(-150, 0, 100);
	    dinoObject.name = "dino";
	    scene.add(dinoObject);
	    scene.updateMatrixWorld(true);
	    dino = scene.getChildByName("dino");
	    position.setFromMatrixPosition(dino.matrixWorld);
	    animate();
	});


	// Add lights to the scene

	light = new THREE.DirectionalLight(0xffffff);
	light.position.set(1, 1, 1);
	scene.add(light);


	light = new THREE.DirectionalLight(0xffffff, .5);
	light.position.set(1, 0, 1);
	scene.add(light);




	stats = new Stats();
	container.appendChild(stats.dom);


	window.addEventListener('resize', onWindowResize, false);

}


// Make the four boundry walls for the maze
function createBoundryWalls() {
	var halfMap = MAPSIZE / 2;
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

function onWindowResize() {

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize(window.innerWidth, window.innerHeight);

}

// Converts degrees to radians
function degreesToRadians(degrees) {
	return degrees * Math.PI / 180;
}

// Converts degrees to radians
function radiansToDegrees(radians) {
	return radians * 180 / Math.PI;
}

//  Determine if the player is colliding 
function detectPlayerCollision() {

	var rotationMatrix;
	var cameraDirection = controls.getDirection(new THREE.Vector3(0, 0, 0)).clone();


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

	if (rotationMatrix !== undefined) {
		cameraDirection.applyMatrix4(rotationMatrix);
	}
	var rayCaster = new THREE.Raycaster(controls.getObject().position, cameraDirection);

	var intersects = rayCaster.intersectObjects(collidableObjects);
	for (var i = 0; i < intersects.length; i++) {
		if (intersects[i].distance < 25) {
			return true;

		}
	}
	return false;
}

function animate() {
	render();
	requestAnimationFrame(animate);
	//console.log("Dino location x:" + dino.position.x + "y: " + dino.position.y + "z: " + dino.position.z);
	var time = performance.now();
	var delta = (time - prevTime) / 1000;
	//console.log(delta);
	    prevTime = time;
	    if (delta < 1.2) {
	    stats.update();

	    //var isBeingChased = triggerChase();
	    if (dino.position.distanceTo(controls.getObject().position) < 120) {
	        dinoAlert.innerHTML = "GAME OVER";

	        //caughtAnimation();
	    } else {
	        //animateDino(delta);
	        animatePlayer(delta);
	    }

	}
}

function triggerChase() {
    // Check if in dino agro range
    if (dino.position.distanceTo(controls.getObject().position) < 300) {
        // Adject the target's y value. We only care about x and z for movement.
        var lookTarget = new THREE.Vector3();
        lookTarget.copy(controls.getObject().position);
        lookTarget.y = dino.position.y;

        // Make dino face camera
        dino.lookAt(lookTarget);
        var distanceFrom = Math.round(dino.position.distanceTo(controls.getObject().position)) - 120;
        // Alert and display distance between camera and dino
        dinoAlert.innerHTML = "Dino has spotted you! Distance from you: " + distanceFrom;
        dinoAlert.style.display = '';
        return true;
    // Not in agro range, don't start distance countdown
    }  else {
        dinoAlert.style.display = 'none';
        return false;
    }
}


function animatePlayer(delta) {
	// Gradual slowdown
	velocity.x -= velocity.x * 10.0 * delta;
	velocity.z -= velocity.z * 10.0 * delta;

	// If no collision, apply movement velocity
	if (detectPlayerCollision() == false) {
	    if (moveForward) {
	        console.log("forward");
	        velocity.z -= 500.0 * delta;
	    }
		if (moveBackward) velocity.z += 500.0 * delta;
		if (moveLeft) velocity.x -= 500.0 * delta;
		if (moveRight) velocity.x += 500.0 * delta;

		controls.getObject().translateX(velocity.x * delta);
		controls.getObject().translateZ(velocity.z * delta);
	} else {
		// Collision. Stop movememnt
		velocity.x = 0;
		velocity.z = 0;
	}
}

function animateDino(delta) {
    // Gradual slowdown
    dinoVelocity.x -= dinoVelocity.x * 10.0 * delta;
    dinoVelocity.z -= dinoVelocity.z * 10.0 * delta;




    // If no collision, apply movement velocity
    if (detectDinoCollision() == false) {
        dinoVelocity.z += 400.0 * delta;


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

function getRandomInt(min, max) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min)) + min;
}


function detectDinoCollision() {
	var matrix = new THREE.Matrix4();
	matrix.extractRotation(dino.matrix);
	var direction = new THREE.Vector3(0, 0, 1);
	direction.applyMatrix4(matrix);


	var rayCaster = new THREE.Raycaster(dino.position, direction);


	var intersects = rayCaster.intersectObjects(collidableObjects);
	for (var i = 0; i < intersects.length; i++) {
		if (intersects[i].distance < 55) {

			return true;
		}
	}

	return false;

}

function render() {
	  	TWEEN.update();
	renderer.render(scene, camera);

}
