import * as THREE from 'three';

const SENSOR_RADIUS = 1;
const SENSOR_HEIGHT = 2;
const SENSOR_MATERIAL = new THREE.MeshStandardMaterial({ color: new THREE.Color('orange').convertSRGBToLinear() }); // new THREE.MeshPhongMaterial( {color: 0xffff00} );

export class Sensor extends THREE.Mesh {
    constructor() {
      super()
      this.geometry = new THREE.ConeGeometry( SENSOR_RADIUS, SENSOR_HEIGHT, 32 )
      this.material = SENSOR_MATERIAL
      this.cubeSize = 0
      this.cubeActive = false
      this.rotation.x = -Math.PI / 2;
      this.position.z = 2;
    }
  
    render() {
      this.rotation.x = this.rotation.y += 0.01
    }
  
    onResize(width, height, aspect) {
      this.cubeSize = (height * aspect) / 5
      this.scale.setScalar(this.cubeSize * (this.cubeActive ? 1.5 : 1))
    }
  
    onPointerOver(e) {
      this.material.color.set('hotpink')
      this.material.color.convertSRGBToLinear()
    }
  
    onPointerOut(e) {
      this.material.color.set('orange')
      this.material.color.convertSRGBToLinear()
    }
  
    onClick(e) {
      this.cubeActive = !this.cubeActive
    }
};