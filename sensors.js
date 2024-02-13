import * as THREE from 'three';

export const ROBOT_RADIUS = 0.5;
export const ROBOT_HEIGHT = 4;

const SENSOR_RADIUS = 0.5;
const SENSOR_HEIGHT = 1;
const SENSOR_COLOR = "yellow";
const CAMERA_COLOR = "blue"
const ACTIVE_COLOR = "pink";

export class Sensor extends THREE.Mesh {
    constructor(y = 0) {
      super()
      this.geometry = new THREE.ConeGeometry( SENSOR_RADIUS, SENSOR_HEIGHT, 32 )
      this.material = new THREE.MeshStandardMaterial({ color: new THREE.Color(SENSOR_COLOR).convertSRGBToLinear() });
      this.active = false
      this.rotation.x = -Math.PI / 2
      this.position.y = y
      this.position.z = ROBOT_RADIUS + 0.5 * SENSOR_HEIGHT
      this.fov = 90
    }
  
    render() {
      this.rotation.x = this.rotation.y += 0.01
    }

    setFOV(fov) {
      var scale = fov / 90
      this.scale.x = scale
      this.scale.z = scale
      this.fov = fov
    }

    updateColor(isHovered) {
      if (!this.active) {
          this.material.color.set(SENSOR_COLOR)
      } else {
          this.material.color.set(ACTIVE_COLOR)
      } 
      if (isHovered) {
          this.material.color.convertSRGBToLinear()
      } 
    }
  
    onPointerOver(e) {
      if (!this.active) {
        this.material.color.set(SENSOR_COLOR)
      }
      else {
        this.material.color.set(ACTIVE_COLOR)
      }
      this.material.color.convertSRGBToLinear()
    }
  
    onPointerOut(e) {
      if (!this.active) {
        this.material.color.set(SENSOR_COLOR)
      }
      else {
        this.material.color.set(ACTIVE_COLOR)
      }
    }
  
    onClick(e) {
      this.active = !this.active
      this.updateColor(false);
    }
};

export class Camera extends Sensor {
  constructor() {
    super()
    this.geometry = new THREE.ConeGeometry(SENSOR_RADIUS * 2, SENSOR_HEIGHT * 2, 4)
    this.material = new THREE.MeshStandardMaterial({ color: new THREE.Color(CAMERA_COLOR).convertSRGBToLinear()})
  }
}