window.addEventListener('DOMContentLoaded', function(){

    // get the canvas DOM element
var canvas = document.getElementById('renderCanvas');

// load the 3D engine
var engine = new BABYLON.Engine(canvas, true);
var bulletList = [];
var enemyList =[];
// createScene function that creates and return the scene
var createScene = function () {
    engine.enableOfflineSupport = false;
    
    // This is really important to tell Babylon.js to use decomposeLerp and matrix interpolation
    BABYLON.Animation.AllowMatricesInterpolation = true;

    var scene = new BABYLON.Scene(engine);
    scene.enablePhysics();
    
    //Adding a light
    var light = new BABYLON.PointLight("Omni", new BABYLON.Vector3(20, 20, 100), scene);
    var SpaceShip;
    
    //Adding an Arc Rotate Camera
    var camera = new BABYLON.FollowCamera("FollowCam", new BABYLON.Vector3(0, -30, 100), scene);

    //The goal distance of camera from target
    camera.radius = 30;

    // The goal height of camera above local origin (centre) of target
    camera.heightOffset = 150;

    // The goal rotation of camera around local origin (centre) of target in x y plane
    camera.rotationOffset = 0;

    //Acceleration of camera in moving from current to goal position
    camera.cameraAcceleration = 0.5

    //The speed at which acceleration is halted 
    camera.maxCameraSpeed = 30

    // This attaches the camera to the canvas
    camera.attachControl(canvas, true);

    // NOTE:: SET CAMERA TARGET AFTER THE TARGET'S CREATION AND NOTE CHANGE FROM BABYLONJS V 2.5
    //targetMesh created here
    BABYLON.SceneLoader.ImportMesh("", "./scenes/", "sg-light-destroyer.babylon", scene, function (newMeshes, particleSystems, skeletons) {
        SpaceShip = newMeshes[0];
        camera.lockedTarget = newMeshes[0];
         //version 2.5 onwards
    });
    var inputMap ={};
    scene.actionManager = new BABYLON.ActionManager(scene);
    scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyDownTrigger, function (evt) {                               
        inputMap[evt.sourceEvent.key] = evt.sourceEvent.type == "keydown";
    }));
    scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyUpTrigger, function (evt) {                             
        inputMap[evt.sourceEvent.key] = evt.sourceEvent.type == "keydown";
    }));
    theta += 90*Math.PI/180;

    // Game/Render loop
    var theta=0;
    scene.onBeforeRenderObservable.add(()=>{

        if(inputMap["w"]){
            SpaceShip.position.z+= 1*-Math.cos(theta);
            SpaceShip.position.x+= 1*-Math.sin(theta);
            
        } 
        if(inputMap["a"] ){
            var axis = new BABYLON.Vector3(0, 1, 0);
            axis.normalize();
            theta -= Math.PI/100;
            var quaternion = new BABYLON.Quaternion.RotationAxis(axis, theta);
            SpaceShip.rotationQuaternion = quaternion;
            //SpaceShip.rotation.y+=0.01;
        } 
        if(inputMap["s"] ){
            SpaceShip.position.z-= 1*-Math.cos(theta);
            SpaceShip.position.x-= 1*-Math.sin(theta);
        } 
        if(inputMap["d"] ){
            var axis = new BABYLON.Vector3(0, 1, 0);
            axis.normalize();
            theta += Math.PI/100;
            var quaternion = new BABYLON.Quaternion.RotationAxis(axis, theta);
            SpaceShip.rotationQuaternion = quaternion;
            //SpaceShip.rotation.y+=0.01;
        }
        if(inputMap["q"] ){
            if (camera.heightOffset == 150) {
                camera.heightOffset = 10;
                camera.radius = 100;    
            }
            else{
                camera.heightOffset = 150;
                camera.radius = 30;
            }
            
        }
        if(inputMap[" "]){
            var sphere = BABYLON.Mesh.CreateSphere("sphere1", 16, 2, scene);
            sphere.position.y = SpaceShip.position.y;
            sphere.position.x = SpaceShip.position.x+3*-Math.sin(theta);;
            sphere.position.z = SpaceShip.position.z+3*-Math.cos(theta);;
            sphere.physicsImpostor = new BABYLON.PhysicsImpostor(sphere, BABYLON.PhysicsImpostor.SphereImpostor, { mass: 0.001, restitution: 0.9 }, scene);
            sphere.physicsImpostor.setLinearVelocity(new BABYLON.Vector3(100 * -Math.sin(theta),0,100 * -Math.cos(theta)));
            bulletList.push(sphere);
        }
        let rand = Math.floor((Math.random() * 100) + 1);
        if (rand > 99) {
            BABYLON.SceneLoader.ImportMesh("", "./scenes/", "star-wars-vader-tie-fighter.babylon", scene, function (newMeshes, particleSystems, skeletons) {
                newMeshes[1].scaling = new BABYLON.Vector3(5, 5, 5);
                newMeshes[1].position.z = SpaceShip.position.z - 100;
                newMeshes[1].position.x = Math.floor((Math.random() * 9) + 1)*20;
                enemyList.push(newMeshes[1]);
            });        
        }
        for (var i = 0; i < enemyList.length; i++) {
            enemyList[i].position.z+=0.5;
        }
        for (var i = 0; i < enemyList.length; i++) {
            if (enemyList[i].position.z > SpaceShip.position.z + 300) {
                enemyList[i].dispose();
                enemyList.splice(i,1);
            }
        }
        for (var i = 0; i < bulletList.length; i++) {
            if (bulletList[i].position.z < SpaceShip.position.z - 300 || bulletList[i].position.z > SpaceShip.position.z + 300 || bulletList[i].position.x > SpaceShip.position.x + 300 || bulletList[i].position.x < SpaceShip.position.x - 300 ) {
                bulletList[i].dispose();
                bulletList.splice(i,1);
            }
        }
        collisionDetector(scene);
    })
    
    return scene;
}

// call the createScene function
var scene = createScene();

// run the render loop
engine.runRenderLoop(function(){
    scene.render();
});

// the canvas/window resize event handler
window.addEventListener('resize', function(){
    engine.resize();
});
function collisionDetector(scene){
    for (var i = 0; i < enemyList.length; i++) {
        try {
            let X = enemyList[i].position.x;
            let Y = enemyList[i].position.z;
            for (var j = 0; j < bulletList.length; j++) {
                let bx = bulletList[j].position.x;
                let by = bulletList[j].position.z;
                if(bx > X && bx < X+7 && by > Y && by < Y+7) {
                    explosion(scene,enemyList[i].position.x,enemyList[i].position.z);
                    enemyList[i].dispose();
                    enemyList.splice(i,1);
                    bulletList[j].dispose();
                    bulletList.splice(j,1);
                }
            }    
        }
        catch(err) {
            console.log("Ya se elimino ese enemigo");
        }

        
    }
}
function explosion(scene, posX,posZ){
    var fountain = BABYLON.Mesh.CreateBox("foutain", 1.0, scene);
    fountain.position = new BABYLON.Vector3(posX,0,posZ);
    fountain.isVisible = false;
    
    var particleSystem = new BABYLON.ParticleSystem("particles", 1000, scene);
    particleSystem.particleTexture = new BABYLON.Texture("scenes/flare.png", scene);
    particleSystem.emitter = fountain;
    particleSystem.minEmitBox = new BABYLON.Vector3(0, 0, 0);
    particleSystem.maxEmitBox = new BABYLON.Vector3(0, 0, 0);
    particleSystem.color1 = new BABYLON.Color4(0.7, 0.8, 1.0, 1.0);
    particleSystem.color2 = new BABYLON.Color4(0.2, 0.5, 1.0, 1.0);
    particleSystem.colorDead = new BABYLON.Color4(0, 0, 0.2, 0.0);
    particleSystem.minSize = 1;
    particleSystem.maxSize = 3;
    particleSystem.minLifeTime = 1;
    particleSystem.maxLifeTime = 1;
    particleSystem.emitRate = 500;
    particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;
    particleSystem.gravity = new BABYLON.Vector3(0, 0, 0);
    particleSystem.direction1 = new BABYLON.Vector3(-5, 5, 5);
    particleSystem.direction2 = new BABYLON.Vector3(5, -5, -5);
    particleSystem.minAngularSpeed = 0;
    particleSystem.maxAngularSpeed = Math.PI;
    particleSystem.minEmitPower = 3;
    particleSystem.maxEmitPower = 6;
    particleSystem.updateSpeed = 0.025;

    
    particleSystem.targetStopDuration = 0.5;
    particleSystem.disposeOnStop = true;
    
    //particleSystem.startDirectionFunction = startDirectionFunction;
    particleSystem.updateFunction = updateFunction;
    particleSystem.start();

    return scene;
    
    var isMoving = false;
    function startMoving(targetMesh) {
        if (!isMoving) {
            isMoving = true;
            fountain.position.addInPlace(new BABYLON.Vector3(0, 0, -40));
        }
    }
    
    function updateFunction (particles) {
        for (var index = 0; index < particles.length; index++) {
            var particle = particles[index];
            particle.age += this._scaledUpdateSpeed;
            // change direction to return to emitter
            if (particle.age >= particle.lifeTime / 1.9) {
                if (!isMoving) startMoving(fountain);
                var oldLength = particle.direction.length(); 
                var newDirection = this.emitter.position.subtract(particle.position);
                particle.direction = newDirection.scale(6);
                startMoving(fountain);
            }

            if (particle.age >= particle.lifeTime) { // Recycle
                particles.splice(index, 1);
                this._stockParticles.push(particle);
                index--;
                continue;
            } else {
                particle.colorStep.scaleToRef(this._scaledUpdateSpeed, this._scaledColorStep);
                particle.color.addInPlace(this._scaledColorStep);
                
                if (particle.color.a < 0)
                  particle.color.a = 0;
                
                particle.angle += particle.angularSpeed * this._scaledUpdateSpeed;
                
                particle.direction.scaleToRef(this._scaledUpdateSpeed, this._scaledDirection);
                particle.position.addInPlace(this._scaledDirection);
                
                this.gravity.scaleToRef(this._scaledUpdateSpeed, this._scaledGravity);
                particle.direction.addInPlace(this._scaledGravity);
            }
        } 
    }

}


});

