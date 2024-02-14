import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Sensor, Camera, ROBOT_HEIGHT, ROBOT_RADIUS } from './sensors.js'

//import ViewCube from 'three-viewcube';

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
    document.getElementById('x-input').value = active_sensor.position.x;
    document.getElementById('y-input').value = active_sensor.position.y;
    document.getElementById('z-input').value = active_sensor.position.z;

    // Update orientation sliders
    var euler = new THREE.Euler();
    euler.setFromQuaternion(active_sensor.quaternion, 'XYZ');
    document.getElementById('pitch-slider').value = euler.x;
    document.getElementById('yaw-slider').value = euler.y;
    document.getElementById('fov-slider').value = active_sensor.fov;
    document.getElementById('pitch-input').value = euler.x;
    document.getElementById('yaw-input').value = euler.y;
    document.getElementById('fov-input').value = active_sensor.fov;
};


function addSensor(isCamera) {
    // Create a cone sensor
    var cone = isCamera ? new Camera(Math.random() * ROBOT_HEIGHT - ROBOT_HEIGHT / 2) : new Sensor(Math.random() * ROBOT_HEIGHT - ROBOT_HEIGHT / 2);
    robot.add( cone );
    var sensorAxesHelper = new THREE.AxesHelper();
    cone.add(sensorAxesHelper)

    const dir = new THREE.Vector3( 0, -1, 0 );

    //normalize the direction vector (convert to vector of length 1)
    dir.normalize();

    const origin = new THREE.Vector3( 0, 0, 0 );
    const length = 1.5;
    const hex = 0xffff00;

    const arrowHelper = new THREE.ArrowHelper( dir, origin, length, hex );
    cone.add( arrowHelper );

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

    // TODO: turn all sliders to default values
    return cone
};

function removeSensor() {
    // remove the active sensor
    robot.remove(active_sensor);
};


function setup(load_env = false) {
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
    if (load_env == true) {
        //load sphere
        loader.load(
            // resource URL
            'data/green_sphere.glb',
            //'data/empty_room_20_20.glb',
            function ( gltf ) {
                gltf.scene.position.y -= ROBOT_HEIGHT / 2
                gltf.scene.position.y += 1.5;
                gltf.scene.position.x -= 3;   
                gltf.scene.position.z -= 3; 
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
        loader.load(
            // resource URL
            'data/len_2.0_rem_0.6_config_0.glb',
            //'data/empty_room_20_20.glb',
            function ( gltf ) {
                gltf.scene.rotation.x = -Math.PI / 2; // Rotate 90 degrees
                gltf.scene.position.y -= ROBOT_HEIGHT / 2;
                gltf.scene.position.x -= 2;   
                gltf.scene.position.z -= 2; 
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
                console.log(error);
            }
        );
    }

    // Create a cylinder
    var geometry = new THREE.CylinderGeometry(ROBOT_RADIUS, ROBOT_RADIUS, ROBOT_HEIGHT, 32);
    const material = new THREE.MeshPhongMaterial();
    robot = new THREE.Mesh( geometry, material );
    // Set robot position
    robot.position.y = ROBOT_HEIGHT / 2;
    robot.position.x = 0;
    robot.position.z = 0;
    scene.add(robot);

    // Create a cone sensor, add to sensors list
    var _ = addSensor(false);

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

/** Set all sensors to inactive */
function deactivateAllSensors() {
    sensors.forEach((sensor) => {
        if (sensor.active) {
            sensor.active = false;
            sensor.updateColor(false);
        }
    });
}

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
    updateSensorPositionText();
};


function updateSensorPositionText() {
    /*
    Here, we want to change the xyz coordinates globally, and change pitch + yaw locally.
    */
    var sensor = active_sensor;
    const x = parseFloat(document.getElementById('x-input').value);
    const y = parseFloat(document.getElementById('y-input').value);
    const z = parseFloat(document.getElementById('z-input').value);
    const pitch = parseFloat(document.getElementById('pitch-input').value);
    const yaw = parseFloat(document.getElementById('yaw-input').value);
    const fov = parseFloat(document.getElementById('fov-input').value);
    
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
    updateSlidersFromSensor();
};


function disableViz() {
    robot.children.forEach((sensor) => {
        sensor.visible = !sensor.visible;
    });
};

function addListeners(){
    // Add event listeners to update the camera position when sliders are moved
    const pos_names = ['x', 'y', 'z', 'pitch', 'yaw', 'fov'];
    for (let i = 0; i < pos_names.length; i++) {
        document.getElementById(pos_names[i].concat('-', 'slider')).addEventListener('input', updateSensorPosition);
        document.getElementById(pos_names[i].concat('-', 'input')).addEventListener('keypress', function(e) {
            // check if the element is an `input` element and the key is `enter`
            console.log(e)
            if(e.target.nodeName === "INPUT" && e.key === 'Enter') {
              updateSensorPositionText();
            }
        });
    };
    document.getElementById('x-input').addEventListener('keypress', function(e) {
        // check if the element is an `input` element and the key is `enter`
        console.log(e)
        if(e.target.nodeName === "INPUT" && e.key === 'Enter') {
          updateSensorPositionText();
        }
    });
    
    var exists = document.getElementById('add-sensor')
    if (exists) { document.getElementById('add-sensor').addEventListener('click', () => addSensor(false)); };
    var exists = document.getElementById('add-camera')
    if (exists) { document.getElementById('add-camera').addEventListener('click', () => addSensor(true)); };
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

setup(false);
addListeners();
animate();