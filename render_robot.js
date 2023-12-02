import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const ROBOT_RADIUS = 1;
const ROBOT_HEIGHT = 5;
const SENSOR_RADIUS = 1;
const SENSOR_HEIGHT = 1;

var scene = new THREE.Scene();
var width = window.innerWidth;
var height = window.innerHeight;
var camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
var renderer = new THREE.WebGLRenderer();
renderer.setSize(400, 400);
document.getElementById("render").appendChild(renderer.domElement);

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

// Create a cylinder
var geometry = new THREE.CylinderGeometry(1, 1, 5, 32);
const material = new THREE.MeshPhongMaterial();
var cylinder = new THREE.Mesh( geometry, material );
scene.add(cylinder);

// Create a cone sensor
const cone_geometry = new THREE.ConeGeometry( 1, 2, 32 ); 
const cone_material = new THREE.MeshBasicMaterial( {color: 0xffff00} );
const cone = new THREE.Mesh(cone_geometry, cone_material ); 
cone.rotation.x = -Math.PI / 2;
cone.position.z = 2;
scene.add( cone );

// These are the default camera positions we can got to: home, side view, top view
const camera_positions = [
    new THREE.Vector3(7, 7, 7),
    new THREE.Vector3(0, 0, 10),
    new THREE.Vector3(0, 20, 0)
];

// Create drag controller
const controls = new OrbitControls( camera, renderer.domElement );
camera.position.copy(camera_positions[0]);
//controls.target.set( camera_positions[0] );
controls.update();
controls.enablePan = false;
controls.enableDamping = true;

function addSensor() {
    // Create a cone sensor
    const cone_geometry = new THREE.ConeGeometry( 1, 2, 32 ); 
    const cone_material = new THREE.MeshBasicMaterial( {color: 0xffff00} );
    const cone = new THREE.Mesh(cone_geometry, cone_material ); 
    cone.rotation.x = -Math.PI / 2;
    cone.position.z = 2;
    scene.add( cone );
}

function updateSensorPosition() {
    /*
    Here, we want to change the xyz coordinates + yaw globally, and change pitch locally.
    */
    const x = parseFloat(document.getElementById('x-slider').value);
    const y = parseFloat(document.getElementById('y-slider').value);
    const z = parseFloat(document.getElementById('z-slider').value);
    const pitch = parseFloat(document.getElementById('pitch-slider').value);
    const yaw = parseFloat(document.getElementById('yaw-slider').value);
    const fov = parseFloat(document.getElementById('fov-slider').value);
    
    cone.position.x = x;
    console.log(cone.position.x);
    cone.position.y = y;
    cone.position.z = z;
    // Set yaw globally: yaw = r_w2c * [yaw vec]
    const myAxis = new THREE.Vector3(0, 1, 0);
    // rotate the mesh 45 on this axis
    //cone.matrix.setRotationFromQuaternion(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, yaw, 0, 'XYZ')));
    //cone.rotation.z = yaw;
    cone.rotation.x = pitch;
    cone.scale.x = fov;
    cone.scale.z = fov;
}

function disableViz() {
    cone.visible = !cone.visible;
}

// Add event listeners to update the camera position when sliders are moved
document.getElementById('x-slider').addEventListener('input', updateSensorPosition);
document.getElementById('y-slider').addEventListener('input', updateSensorPosition);
document.getElementById('z-slider').addEventListener('input', updateSensorPosition);
document.getElementById('pitch-slider').addEventListener('input', updateSensorPosition);
document.getElementById('yaw-slider').addEventListener('input', updateSensorPosition);
document.getElementById('fov-slider').addEventListener('input', updateSensorPosition);
document.getElementById('add-sensor').addEventListener('click', addSensor);
document.getElementById('disable-viz').addEventListener('click', disableViz);

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
};

animate();