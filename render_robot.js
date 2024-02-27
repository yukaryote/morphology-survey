import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Sensor, Camera, ROBOT_HEIGHT, ROBOT_RADIUS } from './sensors.js';
import * as utils from './utils.js';

var view_cameras = [];
var sensor_camera;
var sensor_renderer;

var scenes = [];
var renderers = [];
var robots = [];
var controls_arr = [];
const questions = ["q1", "q2", "q3", "q4"];
const pos_names = ['x', 'y', 'z', 'pitch', 'yaw', 'fov'];

const sensors = new Map();
var active_sensor;
const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2()
let intersects = [];
let hovered = {};
let level = 1;
const MAX_LEVEL = 2;
let renderedGLB = false;

const camera_position = new THREE.Vector3(4, 5, 4);

//results
var results = {};


function updateSlidersFromSensor() {
    var q = active_sensor.parent.name;

    document.getElementById(questions[q] + '-x-slider').value = active_sensor.position.x;
    document.getElementById(questions[q] + '-y-slider').value = active_sensor.position.y;
    document.getElementById(questions[q] + '-z-slider').value = active_sensor.position.z;
    document.getElementById(questions[q] + '-x-input').value = active_sensor.position.x;
    document.getElementById(questions[q] + '-y-input').value = active_sensor.position.y;
    document.getElementById(questions[q] + '-z-input').value = active_sensor.position.z;

    // this quaternion is the sensor's rotation in world coords
    var quaternion = active_sensor.quaternion;
    var euler = new THREE.Euler();
    // this is already the world transformation
    // get yaw (Y-axis) globally and pitch (X-axis) locally by doing YXZ rotation order
    euler.setFromQuaternion(quaternion, 'YXZ');
    document.getElementById(questions[q] + '-pitch-slider').value = euler.x;
    document.getElementById(questions[q] + '-yaw-slider').value = euler.y;
    document.getElementById(questions[q] + '-fov-slider').value = active_sensor.fov;
    document.getElementById(questions[q] + '-pitch-input').value = euler.x;
    document.getElementById(questions[q] + '-yaw-input').value = euler.y;
    document.getElementById(questions[q] + '-fov-input').value = active_sensor.fov;
};


function addSensor(question, isCamera) {
    // Create a cone sensor
    if (question < 2 || robots[question].children.length < 2**question) {
        var cone = isCamera ? new Camera(Math.random() * ROBOT_HEIGHT) : new Sensor(Math.random() * ROBOT_HEIGHT);
        
        robots[question].add( cone );
        console.log("added sensor to robot", question)

        // add camera to sensor. In this case, it'll just average out all the pixels
        sensor_camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
        sensor_camera.rotation.x = cone.rotation.x;
        sensor_camera.rotation.z = Math.PI;
        sensor_camera.position.z = cone.position.z;
        cone.add(sensor_camera);

        // deactivate all other sensors
        sensors.forEach((sensor) => {
            sensor.active = false;
            sensor.updateColor(false);
        });

        sensors.set(cone.uuid, cone);
        cone.onClick();
        cone.active = true;
        cone.updateColor(false);
        active_sensor = cone;
        updateSlidersFromSensor();

        return cone
    }
};

function removeSensor(question) {
    // remove the active sensor
    console.log(question, robots[question])
    robots[question].remove(active_sensor);
};


function setupScene(question) {
    var scene = new THREE.Scene();
    var view_camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    var renderer = new THREE.WebGLRenderer();
    scenes.push(scene);
    renderers.push(renderer);
    view_cameras.push(view_camera)

    //sensor_renderer = new THREE.WebGLRenderer();
    renderer.setSize(400, 400);
    //sensor_renderer.setSize(400, 400);
    var q_string = question + 1
    document.getElementById("q" + q_string + "-render").appendChild(renderer.domElement);
    //document.getElementById("sensor-render").appendChild(sensor_renderer.domElement);

    // 1 directional light, 1 ambient light
    const dl = new THREE.DirectionalLight(0xffffff, 1);
    dl.position.set(0.1, 0.1, 0.1);
    scene.add(dl);

    const ambientLight = new THREE.AmbientLight();
    scene.add(ambientLight);

    //viz axes

    // Create a cylinder
    var geometry = new THREE.CylinderGeometry(ROBOT_RADIUS, ROBOT_RADIUS, ROBOT_HEIGHT, 32);
    const material = new THREE.MeshPhongMaterial();
    var cylinder = new THREE.Mesh( geometry, material );
    var robot = new THREE.Object3D();
    cylinder.position.y = ROBOT_HEIGHT / 2;
    robot.add(cylinder)
    scene.add(robot);

    const axesHelper = new THREE.AxesHelper( 5 );
    robot.add( axesHelper );
    robots.push(robot);

    robot.name = question;

    // Create a cone sensor, add to sensors list
    addSensor(question, false);

    // Create drag controller
    var controls = new OrbitControls( view_camera, renderer.domElement );
    view_camera.position.copy(camera_position);
    controls.update();
    controls.enablePan = true;
    controls.enableDamping = true;

    controls_arr.push(controls)
    // events
    renderer.domElement.addEventListener('pointermove', (e) => {
        //Set the mouse's 2D position in the render frame in NDC coords
        const { left, top } = e.target.getBoundingClientRect();
        const mouseX = e.clientX - left;
        const mouseY = e.clientY - top;
        const normalizedMouseX = mouseX / renderer.domElement.clientWidth;
        const normalizedMouseY = mouseY / renderer.domElement.clientHeight;
        const translatedNormalizedMouseX = 2 * normalizedMouseX - 1;
        const translatedNormalizedMouseY = -(2 * normalizedMouseY - 1);
        mouse.set(translatedNormalizedMouseX, translatedNormalizedMouseY);
        raycaster.setFromCamera(mouse, view_camera)

        intersects = raycaster.intersectObjects(scene.children, true)
        // If a previously hovered item is not among the hits we must call onPointerOut
        Object.keys(hovered).forEach((key) => {
            const hit = intersects.find((hit) => hit.object.uuid === key)
            if (hit === undefined) {
                const hoveredItem = hovered[key]
                if (hoveredItem.object.onPointerOut) {
                    hoveredItem.object.onPointerOut(hoveredItem)
                }
                delete hovered[key]
            }
        })
        intersects.forEach((hit) => {
            // If a hit has not been flagged as hovered we must call onPointerOver
            if (!hovered[hit.object.uuid]) {
            hovered[hit.object.uuid] = hit
            if (hit.object.onPointerOver) hit.object.onPointerOver(hit)
            }
            // Call onPointerMove
            if (hit.object.onPointerMove) hit.object.onPointerMove(hit)
        })
    })

    renderer.domElement.addEventListener("click", (e) => {
      deactivateAllSensors();
      intersects.forEach((hit) => {
        // Call onClick
        if (hit.object.onClick) {
          hit.object.onClick(hit);
          active_sensor = hit.object;
          updateSlidersFromSensor();
          hit.object.updateColor(true);
        }
      });
    });
};


function loadGLB(question) {
    const loader = new GLTFLoader();

    //load sphere
    loader.load(
        // resource URL
        'data/green_sphere.glb',
        //'data/empty_room_20_20.glb',
        function ( gltf ) {
            gltf.scene.position.y += 1.5;
            gltf.scene.position.x += -1;   
            gltf.scene.position.z += 4; 
            scenes[question].add( gltf.scene );

            gltf.animations; // Array<THREE.AnimationClip>
            gltf.scene; // THREE.Group
            gltf.scenes; // Array<THREE.Group>
            gltf.cameras; // Array<THREE.Camera>
            gltf.asset; // Object
        },
        function ( xhr ) {
            console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
        },
        function ( error ) {
            console.log( 'An error happened' );
        }
    );
    loader.load(
        // resource URL
        'data/small2.glb',
        //'data/empty_room_20_20.glb',
        function ( gltf ) {
            //gltf.scene.rotation.x = -Math.PI / 2; // Rotate 90 degrees
            gltf.scene.position.x += 4;   
            gltf.scene.position.z += 6; 
            scenes[question].add( gltf.scene );

            gltf.animations; // Array<THREE.AnimationClip>
            gltf.scene; // THREE.Group
            gltf.scenes; // Array<THREE.Group>
            gltf.cameras; // Array<THREE.Camera>
            gltf.asset; // Object
        },
        function ( xhr ) {
            console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
        },
        function ( error ) {
            console.log( 'An error happened' );
            console.log(error);
        }
    );
}


/** Set all sensors to inactive */
function deactivateAllSensors() {
    sensors.forEach((sensor) => {
        if (sensor.active) {
            sensor.active = false;
            sensor.updateColor(false);
        }
    });
}

function calcSensorPosition(x, y, z, pitch, yaw, fov) {
    /*
    Here, we want to change the xyz coordinates globally, and change pitch + yaw locally.
    */

    var sensor = active_sensor;

    sensor.position.x = x;
    sensor.position.y = y;
    sensor.position.z = z;

    // Set FOV (the size of the cone circle)
    sensor.setFOV(fov);

    // Set yaw globally and pitch locally (since we don't care about roll we can set yaw globally)
    var quaternion = new THREE.Quaternion();
    quaternion.setFromEuler(new THREE.Euler(0, 0, 0, 'XYZ')); // Initialize quaternion

    // Apply yaw (rotation around Y) in the global coordinate frame
    var yawQuaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
    quaternion.multiply(yawQuaternion);

    // Apply pitch (rotation around X) in the local coordinate frame
    var pitchQuaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), pitch);
    quaternion.multiply(pitchQuaternion);

    // Set the object's rotation from the quaternion
    sensor.rotation.setFromQuaternion(quaternion);
}

function updateSensorPositionSlider() {
    var q = active_sensor.parent.name;
    const x = parseFloat(document.getElementById(questions[q] + '-x-slider').value);
    const y = parseFloat(document.getElementById(questions[q] + '-y-slider').value);
    const z = parseFloat(document.getElementById(questions[q] + '-z-slider').value);
    const pitch = parseFloat(document.getElementById(questions[q] + '-pitch-slider').value);
    const yaw = parseFloat(document.getElementById(questions[q] + '-yaw-slider').value);
    const fov = parseFloat(document.getElementById(questions[q] + '-fov-slider').value);
    
    calcSensorPosition(x, y, z, pitch, yaw, fov);
};


function updateSensorPositionText() {
    var q = active_sensor.parent.name;
    const x = parseFloat(document.getElementById(questions[q] + '-x-input').value);
    const y = parseFloat(document.getElementById(questions[q] + '-y-input').value);
    const z = parseFloat(document.getElementById(questions[q] + '-z-input').value);
    const pitch = parseFloat(document.getElementById(questions[q] + '-pitch-input').value);
    const yaw = parseFloat(document.getElementById(questions[q] + '-yaw-input').value);
    const fov = parseFloat(document.getElementById(questions[q] + '-fov-input').value);
    
    calcSensorPosition(x, y, z, pitch, yaw, fov);

    updateSlidersFromText();
};


function updateSlidersFromText() {
    for (let i = 0; i < pos_names.length; i++) {
        for (let j = 0; j < questions.length; j++) {
            document.getElementById(questions[j] + pos_names[i] + '-' + 'slider').value = parseFloat(document.getElementById(questions[j] + pos_names[i] + '-' + 'input').value);
        }
    }
}


function disableViz() {
    var question = active_sensor.parent.name;
    console.log("disable vis for quesetion", question + 1);
    robots[question].children.forEach((sensor) => {
        sensor.visible = !sensor.visible;
    });
};


function addLevelToResults() {
    // after user clicks next-level (if level < 4), save the results to a dictionary
    if (level < MAX_LEVEL) {
        let disp = document.getElementById("level");
        if (level == 1) {
            disp.innerHTML = (level + 1) + ": textural description of environment + 3D render of environment"
        }
        results[level] = {};
        for (let i = 0; i < scenes.length; i++) {
            var sensor_type;
            if (i == 0) {
                sensor_type = "camera";
            }
            results[level][questions[i]] = {};
            for (let j = 0; j < robots[i].children.length; j++) {
                results[level][questions[i]]["sensor_" + j] = {}
                var sensor = robots[i].children[j];
                results[level][questions[i]]["sensor_" + j]["x"] = robots[i].children[j].position.x;
                results[level][questions[i]]["sensor_" + j]["y"] = robots[i].children[j].position.y;
                results[level][questions[i]]["sensor_" + j]["z"] = robots[i].children[j].position.z;
                results[level][questions[i]]["sensor_" + j]["fov"] = robots[i].children[j].fov;

                // this quaternion is the sensor's rotation in world coords
                var quaternion = sensor.quaternion;
                var euler = new THREE.Euler();
                // this is already the world transformation
                // get yaw (Y-axis) globally and pitch (X-axis) locally by doing YXZ rotation order
                euler.setFromQuaternion(quaternion, 'YXZ');
                results[level][questions[i]]["sensor_" + j]["pitch"] = euler.x;
                results[level][questions[i]]["sensor_" + j]["yaw"] = euler.y;
            }
        }
        level++;
        if (level == 2) {
            // add a submit button and also change the env description
            var submit = document.getElementById("submit");
            submit.style.display = "block";

            document.getElementById("env-description").innerHTML = utils.lvl_2_html;
        }
        console.log("level up", level, results);
    }
    else {
        console.log("max level reached");
    }
    return;
}


function saveResultsToTxt() {
    // for each question/scene, save the sensor positions
    addLevelToResults()
    let jsonResults = JSON.stringify(results);
    let blob = new Blob([jsonResults], { type: "application/json" });
    let url = URL.createObjectURL(blob);
    let a = document.createElement("a");
    a.href = url;
    a.download = "results.json";
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
}


function addControlsHTML() {
    for (let i = 0; i < questions.length; i++) {
        var element = document.getElementById(questions[i]);
        element.innerHTML = utils.applyTemplate(utils.controls_html, { q: questions[i] });
    }
}


function addListeners(){
    // Add event listeners to update the camera position when sliders are moved
    for (let i = 0; i < pos_names.length; i++) {
        for (let j = 0; j < questions.length; j++) {
            console.log(questions[j] + '-' + pos_names[i] + '-slider')
            console.log(document.getElementById(questions[j] + '-' + pos_names[i] + '-slider'))
            document.getElementById(questions[j] + '-' + pos_names[i] + '-slider').addEventListener('input', updateSensorPositionSlider);
            document.getElementById(questions[j] + '-' + pos_names[i] + '-input').addEventListener('keypress', function(e) {
                // check if the element is an `input` element and the key is `enter`
                console.log(e)
                if(e.target.nodeName === "INPUT" && e.key === 'Enter') {
                  updateSensorPositionText();
                }
            });
        }
    };

    for (let i = 0; i < questions.length; i++) {
        var exists = document.getElementById(questions[i] + '-add-sensor')
        if (exists) { document.getElementById(questions[i] + '-add-sensor').addEventListener('click', () => addSensor(i, false)); };
        var exists = document.getElementById(questions[i] + '-add-camera')
        if (exists) { document.getElementById(questions[i] + '-add-camera').addEventListener('click', () => addSensor(i, true)); };
        document.getElementById(questions[i] + '-disable-viz').addEventListener('click', disableViz);
    }
    var exists = document.getElementById('submit')
    if (exists) {document.getElementById('submit').addEventListener('click', saveResultsToTxt);}
    document.getElementById('next-level').addEventListener('click', addLevelToResults)
};


function animate() {
    requestAnimationFrame(animate);
    if (level == 2 && !renderedGLB) {
        for (var i = 0; i < renderers.length; i++) {
            loadGLB(i);
        }
        renderedGLB = true;
    };
    controls_arr.forEach(function(control) {
        control.update();
    });
    for (var i = 0; i < renderers.length; i++) {
        renderers[i].render(scenes[i], view_cameras[i]);
    }
    //sensor_renderer.render(scene, sensor_camera);
};

addControlsHTML();
for (var i = 0; i < questions.length; i++) {
    setupScene(i);
}
addListeners();
animate();