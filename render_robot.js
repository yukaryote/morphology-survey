import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Sensor, Camera } from './sensors.js'

//import ViewCube from 'three-viewcube';

const ROBOT_RADIUS = 1;
const ROBOT_HEIGHT = 5;

var controls;
var renderer;
var view_camera;
var sensor_camera;
var robot;
var sensor_renderer;
var scene;
var width = window.innerWidth
var height = window.innerHeight

const sensors = new Map();
var sensor_id = 0;
var active_sensor;
const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2()
let intersects = [];
let hovered = {};


function updateSlidersFromSensor() {
    // Update position sliders
    document.getElementById('x-slider').value = active_sensor.position.x;
    document.getElementById('y-slider').value = active_sensor.position.y;
    document.getElementById('z-slider').value = active_sensor.position.z;

    // Update orientation sliders
    var euler = new THREE.Euler();
    euler.setFromQuaternion(active_sensor.quaternion, 'XYZ');
    document.getElementById('pitch-slider').value = euler.x;
    console.log("update slider from sensor pitch", euler.x)
    document.getElementById('yaw-slider').value = euler.y;
    // Assuming you have a FOV value stored in the sensor object
    document.getElementById('fov-slider').value = active_sensor.fov;
};


function addPhotoreceptor() {
    // Create a cone sensor
    var cone = new Sensor(Math.random() * ROBOT_HEIGHT - ROBOT_HEIGHT / 2);
    robot.add( cone );
    var sensorAxesHelper = new THREE.AxesHelper();
    cone.add(sensorAxesHelper)

    // add camera to sensor. In this case, it'll just average out all the pixels
    sensor_camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    sensor_camera.rotation.x = cone.rotation.x;
    sensor_camera.rotation.z = Math.PI;
    sensor_camera.position.z = cone.position.z;
    cone.add(sensor_camera);

    sensors.set(sensor_id, cone);
    // deactivate all other sensors
    sensors.forEach((sensor) => {
        if (!sensor.active) {
            sensor.onClick()
        }
    });
    cone.onClick();
    active_sensor = cone;
    updateSlidersFromSensor();
    sensor_id++;

    // TODO: turn all sliders to default values
    return cone
};

function addCamera() {
    // Create a cone sensor
    var cone = new Camera(Math.random() * ROBOT_HEIGHT - ROBOT_HEIGHT / 2);
    robot.add( cone );
    var sensorAxesHelper = new THREE.AxesHelper();
    cone.add(sensorAxesHelper)

    // add camera to sensor
    sensor_camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    sensor_camera.rotation.x = cone.rotation.x;
    sensor_camera.rotation.z = Math.PI;
    sensor_camera.position.z = cone.position.z;
    cone.add(sensor_camera);

    sensors.set(sensor_id, cone);
    // deactivate all other sensors
    sensors.forEach((sensor) => {
        if (!sensor.active) {
            sensor.onClick()
        }
    });
    cone.onClick();
    active_sensor = cone;
    updateSlidersFromSensor();
    sensor_id++;

    // TODO: turn all sliders to default values
    return cone
};

function removeSensor() {
    // remove the active sensor
    robot.remove(active_sensor);
};


function setup() {
    scene = new THREE.Scene();
    view_camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    renderer = new THREE.WebGLRenderer();
    const loader = new GLTFLoader();

    //sensor_renderer = new THREE.WebGLRenderer();
    renderer.setSize(400, 400);
    //sensor_renderer.setSize(400, 400);
    document.getElementById("render").appendChild(renderer.domElement);
    //document.getElementById("sensor-render").appendChild(sensor_renderer.domElement);

    // 1 directional light, 1 ambient light
    const dl = new THREE.DirectionalLight(0xffffff, 1);
    dl.position.set(0.1, 0.1, 0.1);
    scene.add(dl);

    const ambientLight = new THREE.AmbientLight();
    scene.add(ambientLight);

    //viz axes
    const axesHelper = new THREE.AxesHelper( 5 );
    scene.add( axesHelper );

    //load env
    loader.load(
        // resource URL
        //'data/len_2.0_rem_0.6_config_0.glb',
        'data/empty_room_20_20.glb',
        function ( gltf ) {
            gltf.scene.rotation.x = -Math.PI / 2; // Rotate 90 degrees
            gltf.scene.position.y -= ROBOT_HEIGHT / 2;
            gltf.scene.position.x -= 2;   
            gltf.scene.position.z -= 2; 
            gltf.scene.scale.x *= 2;
            gltf.scene.scale.y *= 2;
            gltf.scene.scale.z *= 2;
            scene.add( gltf.scene );

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

    // Create a cylinder
    var geometry = new THREE.CylinderGeometry(ROBOT_RADIUS, ROBOT_RADIUS, ROBOT_HEIGHT, 32);
    const material = new THREE.MeshPhongMaterial();
    robot = new THREE.Mesh( geometry, material );
    scene.add(robot);

    // Create a cone sensor, add to sensors list
    var cone = addPhotoreceptor(robot)

    // These are the default camera positions we can got to: home, side view, top view
    const camera_positions = [
        new THREE.Vector3(7, 7, 7),
        new THREE.Vector3(0, 0, 10),
        new THREE.Vector3(0, 20, 0)
    ];

    // Create drag controller
    controls = new OrbitControls( view_camera, renderer.domElement );
    view_camera.position.copy(camera_positions[0]);
    controls.update();
    controls.enablePan = false;
    controls.enableDamping = true;
    // events
    window.addEventListener('pointermove', (e) => {
        //Set the mouse's 2D position in the render frame in NDC coords
        mouse.set(((e.clientX - renderer.domElement.offsetLeft) / renderer.domElement.clientWidth) * 2 - 1, -((e.clientY - renderer.domElement.offsetTop) / renderer.domElement.clientHeight) * 2 + 1);
        raycaster.setFromCamera(mouse, view_camera)
        intersects = raycaster.intersectObjects(scene.children, true)

        // If a previously hovered item is not among the hits we must call onPointerOut
        Object.keys(hovered).forEach((key) => {
            const hit = intersects.find((hit) => hit.object.uuid === key)
            if (hit === undefined) {
            const hoveredItem = hovered[key]
            if (hoveredItem.object.onPointerOver) hoveredItem.object.onPointerOut(hoveredItem)
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

    window.addEventListener('click', (e) => {
    intersects.forEach((hit) => {
        // Call onClick
        if (hit.object.onClick) {
            hit.object.onClick(hit)
            active_sensor = hit.object
            updateSlidersFromSensor()
        }
    })
    })
};

function updateSensorPosition() {
    /*
    Here, we want to change the xyz coordinates globally, and change pitch + yaw locally.
    */
    var sensor = active_sensor;
    const x = parseFloat(document.getElementById('x-slider').value);
    const y = parseFloat(document.getElementById('y-slider').value);
    const z = parseFloat(document.getElementById('z-slider').value);
    const pitch = parseFloat(document.getElementById('pitch-slider').value);
    const yaw = parseFloat(document.getElementById('yaw-slider').value);
    const fov = parseFloat(document.getElementById('fov-slider').value);
    
    sensor.position.x = x;
    sensor.position.y = y;
    sensor.position.z = z;

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

    // Set FOV (the size of the cone circle)
    sensor.setFOV(fov);
};

function disableViz() {
    for (let i = 0; i < sensors.length; i++) {
        sensors[i].visible = !sensors[i].visible;
    }
};

function addListeners(){
    // Add event listeners to update the camera position when sliders are moved
    document.getElementById('x-slider').addEventListener('input', updateSensorPosition);
    document.getElementById('y-slider').addEventListener('input', updateSensorPosition);
    document.getElementById('z-slider').addEventListener('input', updateSensorPosition);
    document.getElementById('pitch-slider').addEventListener('input', updateSensorPosition);
    document.getElementById('yaw-slider').addEventListener('input', updateSensorPosition);
    document.getElementById('fov-slider').addEventListener('input', updateSensorPosition);
    var exists = document.getElementById('add-sensor')
    if (exists) { document.getElementById('add-sensor').addEventListener('click', addPhotoreceptor); };
    var exists = document.getElementById('add-camera')
    if (exists) { document.getElementById('add-camera').addEventListener('click', addCamera); };
    document.getElementById('remove-sensor').addEventListener('click', removeSensor);
    document.getElementById('disable-viz').addEventListener('click', disableViz);
};

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, view_camera);
    //sensor_renderer.render(scene, sensor_camera);
};

setup();
addListeners();
animate();