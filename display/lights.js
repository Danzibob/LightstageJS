import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GeoDome_Geometry} from '/lib/geometry.js'
import { LEDNode } from './led_node.js'

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

// ---=== Shaders for the LED Particles ===---
const vertShader = `\
varying vec3 vColor;
void main() {
	vColor = color;
	vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
	gl_PointSize = 0.2 * ( 300.0 / -mvPosition.z );
	gl_Position = projectionMatrix * mvPosition;
}`

const fragShader = `\
uniform sampler2D spark; 
varying vec3 vColor;
void main() {
	gl_FragColor = vec4( vColor, 1.0 );
	gl_FragColor = gl_FragColor * texture2D( spark, gl_PointCoord );
}`

var uniforms = {
	spark:   { value: new THREE.TextureLoader().load( "spark1.png" ) }
};
const ledsmaterial = new THREE.ShaderMaterial( {
	uniforms:       uniforms,
	vertexShader:   vertShader,
	fragmentShader: fragShader,
	blending:       THREE.AdditiveBlending,
	depthTest:      false,
	transparent:    true,
	vertexColors:   true
});

// ---=== Control Code starts here ===---

// Create LED geometry
var led_particle_geo = new THREE.BufferGeometry()
var colours = []
var positions = []

// --- Load theoretical dome layout ---
// Generate dome config
const geo_dome = new GeoDome_Geometry(2, 1.5)
// Generate LED Nodes
const led_nodes = geo_dome.verts.map(v => new LEDNode(v))
for (var i = 0; i < led_nodes.length; i++){
    // Set all LEDs to 120 brightness
	let node_colours = LEDNode.bytes_to_colours(Array(9).fill(120))
    // Flatten positions and colours
    colours = colours.concat(node_colours.flat())
    positions = positions.concat(led_nodes[i].positions.flatMap(x => x.toArray()))
}

// Apply positions and colours to led particle geometry
led_particle_geo.setAttribute('color', new THREE.Float32BufferAttribute(colours, 3).setUsage(THREE.DynamicDrawUsage))
led_particle_geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
var ledparticles = new THREE.Points(led_particle_geo, ledsmaterial)
scene.add(ledparticles);


function test_effect(t){
    // Seperate spin effects around each axis, for R, G and B
    const NUM_FRAMES = 60 // Frames per loop
    for (var i = 0; i < led_nodes.length; i++){
        let pos = led_nodes[i].pos
        // let val = (pos.x * 10 + Math.sin(t/10)*20)
        let xz = (Math.atan2(pos.z, pos.x)/Math.PI + t/NUM_FRAMES)%(1)
        let zy = (Math.atan2(pos.y, pos.z)/Math.PI + t/NUM_FRAMES)%(1)
        let yx = (Math.atan2(pos.x, pos.y)/Math.PI + t/NUM_FRAMES)%(1)
        let node_values = [xz,zy,yx,0,0,0,0,0,0]
        let node_colours = LEDNode.bytes_to_colours(node_values).flat()
        for(let cidx=0; cidx<27; cidx++){
            led_particle_geo.attributes.color.array[i*27+cidx] = node_colours[cidx]
        }
    }
    led_particle_geo.attributes.color.needsUpdate = true
}


// Animate the scene
let frame = 0
function animate() {
    test_effect(frame)
	requestAnimationFrame( animate )
	renderer.render( scene, camera )
    frame++
}
animate()