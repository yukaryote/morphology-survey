import * as THREE from 'three';

const ROBOT_RADIUS = 1;
const ROBOT_HEIGHT = 5;

const SENSOR_RADIUS = 0.5;
const SENSOR_HEIGHT = 1;
const color = "yellow";
const camera_color = "blue"
const SENSOR_MATERIAL = new THREE.MeshStandardMaterial({ color: new THREE.Color(color).convertSRGBToLinear() }); // new THREE.MeshPhongMaterial( {color: 0xffff00} );
const CAMERA_MATERIAL = new THREE.MeshStandardMaterial({ color: new THREE.Color(camera_color).convertSRGBToLinear() }); 

export class Sensor extends THREE.Mesh {
    constructor(y = 0) {
      super()
      this.geometry = new THREE.ConeGeometry( SENSOR_RADIUS, SENSOR_HEIGHT, 32 )
      this.material = SENSOR_MATERIAL
      this.active = false
      this.rotation.x = -Math.PI / 2
      this.position.y = y
      this.position.z = ROBOT_RADIUS + 0.5 * SENSOR_HEIGHT
      this.active_color = 'hotpink'
    }
  
    render() {
      this.rotation.x = this.rotation.y += 0.01
    }
  
    onPointerOver(e) {
      this.material.color.set(this.active_color)
      this.material.color.convertSRGBToLinear()
    }
  
    onPointerOut(e) {
      if (!this.active) {
        this.material.color.set(color)
        this.material.color.convertSRGBToLinear()
      }
    }
  
    onClick(e) {
      this.active = !this.active
      if (this.active) {
        this.material.color.set(this.active_color)
      }
      else {
        this.material.color.set(color)
      }
    }
};

export class Camera extends Sensor {
  constructor() {
    super()
    this.geometry = new THREE.ConeGeometry(SENSOR_RADIUS * 2, SENSOR_HEIGHT * 2, 4)
    this.material = CAMERA_MATERIAL
  }
}