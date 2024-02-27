import * as THREE from 'three';

export const ROBOT_RADIUS = 0.5;
export const ROBOT_HEIGHT = 2.5;

const SENSOR_RADIUS = 0.25;
const SENSOR_HEIGHT = 0.5;
const SENSOR_COLOR = "yellow";
const CAMERA_COLOR = "blue"
const ACTIVE_COLOR = "pink";

export class Sensor extends THREE.Mesh {
    constructor(y = 0) {
      super()
      this.geometry = new THREE.ConeGeometry( SENSOR_RADIUS, SENSOR_HEIGHT, 32 )
      this.material = new THREE.MeshStandardMaterial({ color: new THREE.Color(SENSOR_COLOR).convertSRGBToLinear() });
      this.active = false

      this.rotation.set(-Math.PI / 2, 0, 0);
      //this.position.y = y;      
      this.fov = 90;
      this.setFOV(this.fov);

      this.updateMatrix();
      this.geometry.applyMatrix4(this.matrix);
      this.rotation.set(0, 0, 0);
      this.position.set(0, y, ROBOT_RADIUS + 0.5 * SENSOR_HEIGHT);

      const dir = new THREE.Vector3( 0, 0, 1 );

      //normalize the direction vector (convert to vector of length 1)
      dir.normalize();
  
      const origin = new THREE.Vector3( 0, 0, 0 );
      const length = .75;
      const hex = 0xffff00;
  
      const arrowHelper = new THREE.ArrowHelper( dir, origin, length, hex );
      this.add( arrowHelper );

      var sensorAxesHelper = new THREE.AxesHelper();
      this.add(sensorAxesHelper);
    }

    setFOV(fov) {
      var scale = fov / 90
      this.scale.x = scale
      this.scale.y = scale
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