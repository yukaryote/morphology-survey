import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Sensor } from './sensors.js'

//import ViewCube from 'three-viewcube';

const ROBOT_RADIUS = 1;
const ROBOT_HEIGHT = 5;

var controls;
var renderer;
var view_camera;
var sensor_camera;
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

function addSensor() {
    // Create a cone sensor
    var cone = new Sensor();
    scene.add( cone );

    // add camera to sensor
    sensor_camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    sensor_camera.rotation.x = -Math.PI / 2;
    sensor_camera.rotation.z = Math.PI;
    sensor_camera.position.z = 2;
    cone.add(sensor_camera);

    sensors.set(sensor_id, cone);
    sensor_id++;
    return cone;
};

// responsive
function select() {
    view_camera.aspect = width / height
    const target = new THREE.Vector3(0, 0, 0)
    const distance = view_camera.position.distanceTo(target)
    const fov = (view_camera.fov * Math.PI) / 180
    const viewportHeight = 2 * Math.tan(fov / 2) * distance
    const viewportWidth = viewportHeight * (width / height)
    view_camera.updateProjectionMatrix()
    renderer.setSize(width, height)
    scene.traverse((obj) => {
      active_sensor = obj
    })
};

function setup() {
    scene = new THREE.Scene();
    view_camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    renderer = new THREE.WebGLRenderer();
    const loader = new GLTFLoader();

    sensor_renderer = new THREE.WebGLRenderer();
    renderer.setSize(400, 400);
    sensor_renderer.setSize(400, 400);
    document.getElementById("render").appendChild(renderer.domElement);
    document.getElementById("sensor-render").appendChild(sensor_renderer.domElement);

    // 2 directional lights
    const dl = new THREE.DirectionalLight(0xffffff, 1);
    dl.position.set(0.1, 0.1, 0.1);
    scene.add(dl);

    const dl2 = new THREE.DirectionalLight(0xffffff, 1);
    dl2.position.set(-0.1, 0.1, -0.1);
    scene.add(dl2);

    //viz axes
    const axesHelper = new THREE.AxesHelper( 5 );
    scene.add( axesHelper );

    //load env
    loader.load(
        // resource URL
        //'data/len_2.0_rem_0.6_config_0.glb',
        'data/empty_room_20_20.glb',
        // called when the resource is loaded
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
        // called while loading is progressing
        function ( xhr ) {

            console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );

        },
        // called when loading has errors
        function ( error ) {

            console.log( 'An error happened' );

        }
    );

    // Create a cylinder
    var geometry = new THREE.CylinderGeometry(ROBOT_RADIUS, ROBOT_RADIUS, ROBOT_HEIGHT, 32);
    const material = new THREE.MeshPhongMaterial();
    var cylinder = new THREE.Mesh( geometry, material );
    scene.add(cylinder);

    // Create a cone sensor, add to sensors list
    var cone = addSensor()

    sensors.set(sensor_id, cone);
    sensor_id++;

    // These are the default camera positions we can got to: home, side view, top view
    const camera_positions = [
        new THREE.Vector3(7, 7, 7),
        new THREE.Vector3(0, 0, 10),
        new THREE.Vector3(0, 20, 0)
    ];


    // Create drag controller
    controls = new OrbitControls( view_camera, renderer.domElement );
    view_camera.position.copy(camera_positions[0]);
    //controls.target.set( camera_positions[0] );
    controls.update();
    controls.enablePan = false;
    controls.enableDamping = true;

    window.addEventListener('select', select)

    // events
    window.addEventListener('pointermove', (e) => {
    mouse.set((e.clientX / width) * 2 - 1, -(e.clientY / height) * 2 + 1)
    raycaster.setFromCamera (mouse, view_camera)
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
        if (hit.object.onClick) hit.object.onClick(hit)
    })
    })
};

function updateSensorPosition(sensor_id) {
    /*
    Here, we want to change the xyz coordinates + yaw globally, and change pitch locally.
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
    // Set yaw globally: yaw = r_w2c * [yaw vec]
    const myAxis = new THREE.Vector3(0, 1, 0);
    // rotate the mesh 45 on this axis
    //cone.matrix.setRotationFromQuaternion(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, yaw, 0, 'XYZ')));
    //cone.rotation.z = yaw;
    sensor.rotation.x = pitch;
    sensor.scale.x = fov;
    sensor.scale.z = fov;
};

function disableViz() {
    for (let i = 0; i < sensors.length; i++) {
        sensors[i].visible = !sensors[i].visible;
    }
};

function addListeners(){
    // Add event listeners to update the camera position when sliders are moved
    document.getElementById('x-slider').addEventListener('input', function(event) { updateSensorPosition(event); });
    document.getElementById('y-slider').addEventListener('input', function(event) { updateSensorPosition(event); });
    document.getElementById('z-slider').addEventListener('input', function(event) { updateSensorPosition(event); });
    document.getElementById('pitch-slider').addEventListener('input', function(event) { updateSensorPosition(event); });
    document.getElementById('yaw-slider').addEventListener('input', function(event) { updateSensorPosition(event); });
    document.getElementById('fov-slider').addEventListener('input', function(event) { updateSensorPosition(event); });
    document.getElementById('add-sensor').addEventListener('click', addSensor);
    document.getElementById('disable-viz').addEventListener('click', disableViz);
};

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, view_camera);
    sensor_renderer.render(scene, sensor_camera);
};

setup();
addListeners();
animate();