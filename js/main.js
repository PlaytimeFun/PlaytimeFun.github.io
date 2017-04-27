var UNITWIDTH = 90;         // Width of the cubes in the maze
var UNITHEIGHT = 45;        // Height of the cubes in the maze
var CATCHOFFSET = 150;      // How close dino can get before game over
var CHASERANGE = 200;       // How close dino can get before tirggering the chase
var DINOSCALE = 20;         // How much to multiple the size of the dino by
var DINOSPEED = 1600;       // How fast the dino will move

var DINORAYLENGTH = 55;     // How close dino can get to collidable objects
var ROARDIVISOR = 250;      // How many frames to wait between roar animations (Once game over)

var instructBox;            // Textured box that displays the game instructions

// Game states
var begin = false;          // Flag to determine whether the game should begin
var gameOver = false;       // Flag to determines whether the game is over

var scene;
var camera;                 // The camera for the scene
var ground;                 // The ground plane mesh
var totalCubesWide;         // How many wall cubes can make the width of the map
var mapSize;                // Height and width of the maze ground plane
var collidableObjects = []; // Array holding all meshes that are collidable
var dino;                   // The dino mesh
var dinoVelocity = new BABYLON.Vector3(0, 0, 0); // The direction to apply the movement velocity of dino


var headset;
// If a VR headset is connected, get its info
navigator.getVRDisplays().then(function(displays) {
  if(displays[0]) {
      headset = displays[0];
  }
});


window.addEventListener('DOMContentLoaded', function () {

    // Connects an xbox controller has been plugged in and and a button/trigger moved,
    function onNewGamepadConnected(gamepad) {
        var xboxpad = gamepad

        xboxpad.onbuttondown(function (buttonValue) {
            // When the A button is pressed, either start or reload the game depending on the game state
            if (buttonValue == BABYLON.Xbox360Button.A) {

                // Game is over, reload it
                if (gameOver) {
                    location.reload();
                }
                // Game has begun
                else {
                    // Remove instructions box
                    instructBox.dispose();
                    begin = true;
                    // Start looping the dino walking animation
                    scene.beginAnimation(dino.skeleton, 111, 130, true, 1);
                }
            }
        });
    }

    // Get all connected gamepads
    var gamepads = new BABYLON.Gamepads(function (gamepad) { onNewGamepadConnected(gamepad); });


    // Grab where we'll be displayed the game
    var canvas = document.getElementById('renderCanvas');

    // load the 3D engine
    var engine = new BABYLON.Engine(canvas, true);



    var createNewWSC = function (scene) {
        var myText2D = new BABYLON.Text2D("Hellooooo", { fontName: "50pt Lucida Console", marginAlignment: "h: center, v: center", fontSignedDistanceField: true });
        
        var WSC = new BABYLON.WorldSpaceCanvas2D(scene, new BABYLON.Size(3, 3), {
            id: "WorldSpaceCanvas",
            backgroundFill: "#C0C0C040",
            backgroundRoundRadius: 20,
            unitScaleFactor: 100,
            children: [myText2D]
        });
    
        return WSC;
    };

    // Creates and return the scene
    var createScene = function () {

        // Create the Babylon scene
        var scene = new BABYLON.Scene(engine);

        // Apply gravity so that any Y axis movement is ignored
        scene.gravity = new BABYLON.Vector3(0, -9.81, 0);

        // Turn on fog for cool effects
        scene.fogMode = BABYLON.Scene.FOGMODE_EXP;
        scene.fogDensity = 0.001;
        scene.fogColor = new BABYLON.Color3(0.9, 0.9, 0.85);



        // Create a WebVR camera with the trackPosition property set to false so that we can control movement with the gamepad
        camera = new BABYLON.VRDeviceOrientationFreeCamera("vrcam", new BABYLON.Vector3(0, 18, -45), scene);


        // Set the ellipsoid around the camera. This will act as the collider box for when the player runs into walls
        camera.ellipsoid = new BABYLON.Vector3(1, 9, 1);
        camera.applyGravity = true;

        // attach the camera to the canvas once the user clicks the window. Needed to activate webvr/headset connection
        scene.onPointerDown = function () {
            scene.onPointerDown = undefined
            camera.attachControl(canvas, true);
        }

        // Custom input, adding xbox controller support for left analog stick to map to keyboard arrows
        camera.inputs.attached.keyboard.keysUp.push(211);
        camera.inputs.attached.keyboard.keysDown.push(212);
        camera.inputs.attached.keyboard.keysLeft.push(214);
        camera.inputs.attached.keyboard.keysRight.push(213);


        var a = createNewWSC(scene);
        a.worldSpaceCanvasNode.parent  = camera;
        a.worldSpaceCanvasNode.position.y = camera.position.y;
        a.worldSpaceCanvasNode.position.x = camera.position.x + 5;
        a.worldSpaceCanvasNode.position.z = camera.position.z + 5;
        a.worldSpaceCanvasNode.material.backFaceCulling = false;


        // Create the instructionx display box
        instructBox = BABYLON.MeshBuilder.CreateBox("instructbox", { height: 50, width: 80, depth: 1 }, scene);
        instructBox.position = new BABYLON.Vector3(0,20,140);
        // Apply the texture to the material
        var instructMaterial = new BABYLON.StandardMaterial("instructionTexture", scene);
        instructMaterial.specularTexture = new BABYLON.Texture("textures/instructions.png", scene);
        instructMaterial.ambientTexture = new BABYLON.Texture("textures/instructions.png", scene);
        // Apply the material to the mesh
        instructBox.material = instructMaterial;

        // Create the skybox
        var skybox = BABYLON.Mesh.CreateBox("skyBox", 5000.0, scene);
        var skyboxMaterial = new BABYLON.StandardMaterial("skyBox", scene);
        skyboxMaterial.backFaceCulling = false;
        skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("textures/skybox", scene);
        skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
        skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
        skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
        skyboxMaterial.disableLighting = true;
        skybox.material = skyboxMaterial;

        // return the created scene
        return scene;
    }

	 // Listen for if the window changes sizes and adjust
    window.addEventListener('resize', onWindowResize, false);
    // Create the scene
    var scene = createScene();

    // Load the dinosaur model
    BABYLON.SceneLoader.ImportMesh("Dino", "models/", "dino.babylon", scene, function (newMeshes) {


        dino = newMeshes[0];

        // Set the initial size and position of the dino
        dino.scaling = new BABYLON.Vector3(DINOSCALE, DINOSCALE, DINOSCALE);
        dino.position = new BABYLON.Vector3(500, 18, -30);
        // Set the size of the ellips-shaped collider around dino
        dino.ellipsoid = new BABYLON.Vector3(.5, .5, .5);
        dino.rotation.y = degreesToRadians(90);

        // Enable blending of animations (i.e. transitioning from standing to walking animation smoothly)
        dino.skeleton.enableBlending(0.1)



        // Start looping the standing animation before the game begins
        dino.skeleton.beginAnimation("stand", true, .5);


        // Run the render loop (fired every time a new frame is rendered)
        animate();

    });

    // Create the walls/ground
    createMazeCubes();
	 addLights();
    createGround();
    createPerimWalls();
	 enableAndCheckCollisions();


    // Create a maze of cubes whose postions are based off a 2D array
    function createMazeCubes() {
        // Maze wall mapping, assuming matrix
        // 1's are cubes, 0's are empty space
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
            [0, 0, 1, 1, 1, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0,]
        ];

        // Create wall material
        var wallMat = new BABYLON.StandardMaterial("wallMat", scene);
        wallMat.diffuseColor = new BABYLON.Color3.FromInts(129, 207, 224);
        wallMat.specularColor = new BABYLON.Color3.FromInts(70, 70, 70);
        wallMat.ambientColor = new BABYLON.Color3.FromInts(70, 70, 70);


        // Keep cubes within boundry walls
        var widthOffset = UNITWIDTH / 2;
        // Put the bottom of the cube at y = 0
        var heightOffset = UNITHEIGHT / 2;

        // See how wide the map is by checking how long the first array is
        totalCubesWide = map[0].length;

        // Place cubes where 1`s are
        for (var i = 0; i < totalCubesWide; i++) {
            for (var j = 0; j < map[i].length; j++) {
                // If a 1 is found, add a cube at the corresponding position
                if (map[i][j]) {
                    // Make the cube
                    var cube = BABYLON.MeshBuilder.CreateBox("cube", { height: UNITHEIGHT, width: UNITWIDTH, depth: UNITWIDTH }, scene);
                    cube.material = wallMat;
                    // Set the cube position
                    cube.position.z = (i - totalCubesWide / 2) * UNITWIDTH + widthOffset;
                    cube.position.y = heightOffset;
                    cube.position.x = (j - totalCubesWide / 2) * UNITWIDTH + widthOffset;

                    // Make the cube collidable
                    collidableObjects.push(cube);

                }
            }
        }
        // Set what the size of the ground should be based on the map size the matrix/cube size produced
        mapSize = totalCubesWide * UNITWIDTH;
    }

	 // Create some lights to brighten up our scene
	 function addLights() {
		 var light0 = new BABYLON.PointLight('light0', new BABYLON.Vector3(1, 10, 0), scene);
		 light0.groundColor = new BABYLON.Color3(0, 0, 0);

		 var light1 = new BABYLON.HemisphericLight("light2", new BABYLON.Vector3(0, 1, 0), scene);
		 light1.diffuse = new BABYLON.Color3(.5, .5, .5);
		 light1.specular = new BABYLON.Color3(.5, .5, .5);
		 light1.groundColor = new BABYLON.Color3(0, 0, 0);
	 }

    // Create the ground plane that the maze sits on top of
    function createGround() {
        var groundMat = new BABYLON.StandardMaterial("groundMat", scene);
        groundMat.diffuseColor = new BABYLON.Color3.FromInts(110, 82, 45);

        ground = BABYLON.Mesh.CreateGround('ground', mapSize, mapSize, 2, scene);
        ground.material = groundMat;
    }


    // Make the four perimeter walls for the maze
    function createPerimWalls() {
        var halfMap = mapSize / 2;  // Half the size of the map
        var sign = 1;               // Used to make an amount positive or negative

        var perimMat = new BABYLON.StandardMaterial("perimMat", scene);
        perimMat.diffuseColor = new BABYLON.Color3.FromInts(70, 70, 70);
        perimMat.specularColor = new BABYLON.Color3.FromInts(70, 70, 70);
        perimMat.ambientColor = new BABYLON.Color3.FromInts(70, 70, 70);

        // Loop through twice, making two perimeter walls at a time
        for (var i = 0; i < 2; i++) {
            // Make a left/right wall and a front/back wall
            var perimWallLR = BABYLON.MeshBuilder.CreateBox("planeLR", { height: UNITHEIGHT, width: mapSize, depth: 1 }, scene);
            var perimWallFB = BABYLON.MeshBuilder.CreateBox("planeFB", { height: UNITHEIGHT, width: mapSize, depth: 1 }, scene);

            // Create left/right walls
            perimWallLR.position = new BABYLON.Vector3(-halfMap * sign, UNITHEIGHT / 2, 0);
            perimWallLR.rotation.y = degreesToRadians(90);

            // Create front/back walls
            perimWallFB.position = new BABYLON.Vector3(0, UNITHEIGHT / 2, halfMap * sign);
            collidableObjects.push(perimWallLR);
            collidableObjects.push(perimWallFB);
            sign = -1; // Swap to negative value
        }
    }

	 function enableAndCheckCollisions() {
		 // Add collision checks for the camera, ground, and walls
		 scene.collisionsEnabled = true;
		 camera.checkCollisions = true;
		 ground.checkCollisions = true;

		 // Loop through all walls and make them collidable
		 for (var i = 0; i < collidableObjects.length; i++) {
			  collidableObjects[i].checkCollisions = true;
		 }
	 }

    // Run the render loop (fired every time a new frame is rendered)
    function animate() {

        engine.runRenderLoop(function () {
            // Determine which camera should be showing depending on whether or not the headset is presenting
            if(headset) {
                if(!(headset.isPresenting)) {
                      var camera2 = new BABYLON.VRDeviceOrientationFreeCamera("vrcam", new BABYLON.Vector3(0, 18, -45), scene);
                      scene.activeCamera = camera2;
                              var a = createNewWSC(scene);
        a.worldSpaceCanvasNode.parent  = camera2;
        a.worldSpaceCanvasNode.position.y = camera2.position.y;
        a.worldSpaceCanvasNode.position.x = camera2.position.x + 5;
        a.worldSpaceCanvasNode.position.z = camera2.position.z + 5;
        a.worldSpaceCanvasNode.material.backFaceCulling = false;
                } else {
                    scene.activeCamera = camera;
                }
            }

            scene.render();

            // Get the change in time between the last frame and the current frame
            var delta = engine.getDeltaTime() / 1000;

            // Check if A has been pressed to start the game
            if (begin == true) {

                // Calculate the distance between the camera and dino
                dinoDistanceFromPlayer = Math.round(BABYLON.Vector3.Distance(dino.position, camera.position));
                // Round the distance, and use CATCHOFFSET to specify how far away we want dino to be to trigger game over
                dinoDistanceFromPlayer = Math.round(dinoDistanceFromPlayer - CATCHOFFSET);

                // If dino is within range, begin the chase
                beginChase(dinoDistanceFromPlayer);

                // Dino has made it to the catch distance, trigger end of game
                if (dinoDistanceFromPlayer <= 0) {
                    caught();
                }
                // Player has moved out of chase range, hide distance counter UI
                else {
                    // Decrement to keep speed consistent
                    dinoVelocity.z -= dinoVelocity.z * delta;

                    // No collision, apply movement velocity
                    if (detectDinoCollision() == false) {
                        dinoVelocity.z += DINOSPEED * delta / 1000;
                        // Move the dino forward
                        dino.translate(new BABYLON.Vector3(0, 0, -1), dinoVelocity.z * delta);
                        // Collision. Adjust direction
                    } else {
                        // An array of direction multiples that will correspond to -90, 90, and 180 degree rotations
                        var directionMultiples = [-1, 1, 2];
                        // Generate a randon direciton multiple
                        var randomIndex = getRandomInt(0, 2);

                        // Add the new direction to dino's current rotation
                        dino.rotation.y += degreesToRadians(90 * directionMultiples[randomIndex]);
                    }
                }
            }
        });
    }

    // Taking a distance, determines if the dino is close enough to the player to start chasing them.
    // If too far away, that chase ends/doesn't start and the distance counter UI is hidden.
    function beginChase(distanceAway) {
        // Dino in chasing range, display the distance counter UI and point dino is player direction
        if (distanceAway < CHASERANGE) {
            scene.fogColor = new BABYLON.Color3(.5, 0, 0);
            dino.lookAt(new BABYLON.Vector3(camera.position.x, dino.position.y, camera.position.z));
            // Dino not in chasing range, make sure distance counter is hidden
        } else {
            scene.fogColor = new BABYLON.Color3(0.9, 0.9, 0.85);
        }
    }

    // Set a counter to keep track of animation timing for the end game animations
    var frameCount = 0;

    // Updates the game state and begins the ending animations for the game
    function caught() {
        scene.fogColor = new BABYLON.Color3(0, 0, 0);
        // Update game state
        gameOver = true;

        // Disable all movement except head rotation
        //camera.inputs.removeByType("FreeCameraKeyboardMoveInput");

        // Every ROARDIVISOR frames make the dino roar
        if (frameCount % ROARDIVISOR == 0) {
            dino.skeleton.beginAnimation("roar", false, .5, function () {
                // Roar complete, do the standing animation in between roars
                dino.skeleton.beginAnimation("stand", true, .5);
            });
        }
        frameCount++;
    }

    // Check to see if the raycaster of the dino has hit a collidable mesh
    function detectDinoCollision() {
        var origin = dino.position;

        // Get the forward vector of the dino
        var forward = new BABYLON.Vector3(0, 0, -1);
        forward = vecToLocal(forward, dino);

        // Get the unit vector for direction
        var direction = forward.subtract(origin);
        direction = BABYLON.Vector3.Normalize(direction);

        // Create the ray coming out of the front of the dino mesh
        var ray = new BABYLON.Ray(origin, direction, DINORAYLENGTH);

        // Check to see if the ray has hit anything
        var hit = scene.pickWithRay(ray);

        // If we hit a collidable mesh, return true
        if (hit.pickedMesh) {
            return true;
        }
        return false;
    }


    // Helper function that generates a random integer within a range
    function getRandomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min)) + min;
    }


    // Helper function that converts degrees to radians
    function degreesToRadians(degrees) {
        return degrees * Math.PI / 180;
    }

    // Helper function that converts radians to degrees
    function radiansToDegrees(radians) {
        return radians * 180 / Math.PI;
    }

    // Helper function to compute a directional vector in the frame of reference of a mesh
    function vecToLocal(vector, mesh) {
        // Get the position of the mesh compared to the world
        var m = mesh.getWorldMatrix();
        // Get direction vector in relation to mesh
        var v = BABYLON.Vector3.TransformCoordinates(vector, m);
        return v;
    }


	 // When the window resizes, adjust the engine size
    function onWindowResize() {
        engine.resize();
    }
});
