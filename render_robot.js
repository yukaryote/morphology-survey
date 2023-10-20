var scene = new THREE.Scene();
var width = window.innerWidth;
var height = window.innerHeight;
var camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
const renderers = [];
for (let i = 0; i < 3; i++) {
    var renderer = new THREE.WebGLRenderer();
    renderer.setSize(400, 400);
    document.getElementById("render").appendChild(renderer.domElement);
    renderers.push(renderer)
}

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

// Add the cylinder to the scene
scene.add(cylinder);

// Create a cone sensor
const cone_geometry = new THREE.ConeGeometry( 1, 2, 32 ); 
const cone_material = new THREE.MeshBasicMaterial( {color: 0xffff00} );
const cone = new THREE.Mesh(cone_geometry, cone_material ); 
cone.rotation.x = -Math.PI / 2;
cone.position.z = 2;
scene.add( cone );

// Position the camera
camera.position.z = 10;

// Render the scene
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

function updateSensorPosition() {
    const height = parseFloat(document.getElementById('x-slider').value);
    const pitch = parseFloat(document.getElementById('y-slider').value);
    const fov = parseFloat(document.getElementById('z-slider').value);

    cone.position.y = height;
    cone.rotation.x = pitch;
    cone.scale.x = fov;
    cone.scale.y = fov;
}

// Add event listeners to update the camera position when sliders are moved
document.getElementById('x-slider').addEventListener('input', updateSensorPosition);
document.getElementById('y-slider').addEventListener('input', updateSensorPosition);
document.getElementById('z-slider').addEventListener('input', updateSensorPosition);

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    const camera_positions = [
        new THREE.Vector3(7, 7, 7),
        new THREE.Vector3(0, 0, 10),
        new THREE.Vector3(0, 20, 0)
    ];

    for (let i = 0; i < renderers.length; i++) {
        camera.position.copy(camera_positions[i]);
        camera.lookAt(0, 0, 0);
        renderers[i].render(scene, camera);
    }
};

animate();