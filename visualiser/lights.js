import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { LightingInterface } from '/visualiser/visualiser.js'
import { segment_spin_px, snake } from 'lighting_effects'

// ---=== Set up scene and renderer ===---

var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.x = 0;
camera.position.z = 5;

var renderer = new THREE.WebGLRenderer();
renderer.setPixelRatio( window.devicePixelRatio );
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls( camera, renderer.domElement );

var axesHelper = new THREE.AxesHelper(1);
scene.add( axesHelper );

let dome = new LightingInterface()
await dome.load_geo_from_file("/dome.config")
// dome.load_geo_dome(2,1.5)
dome.init_particles(scene)


const FRAMES_PER_LOOP = 8

// Export animation
let s = ""
for(let t = 0; t < FRAMES_PER_LOOP; t++){
    let effect_angle = ((t/FRAMES_PER_LOOP)%2) * Math.PI
    dome.effect(segment_spin_px, effect_angle, 2*Math.PI/3)
    let f =  dome.export_current_frame()
    console.log(f)
    s += f + "show\n"
}
console.log(s)

// Animate the scene
let frame = 0
function animate() {
    let effect_angle = (frame/FRAMES_PER_LOOP)% (2 * Math.PI)
    dome.effect(segment_spin_px, effect_angle, 2*Math.PI/3)
    frame++
	requestAnimationFrame( animate )
	renderer.render( scene, camera )
}

animate()


