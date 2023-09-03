import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GeoDome_Geometry} from '/lib/geometry.js'
import { LEDNode } from '../lib/led_node.js'

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
	gl_PointSize = 0.08 * ( 300.0 / -mvPosition.z );
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
var led_nodes = []

// --- Load theoretical dome layout ---
function load_model_dome(){
    // Generate dome config
    const geo_dome = new GeoDome_Geometry(2, 1.5)
    // Generate LED Nodes
    led_nodes = geo_dome.verts.map(v => new LEDNode(v))
    for (var i = 0; i < led_nodes.length; i++){
        // Set all LEDs to 0.8 brightness
        let node_colours = LEDNode.bytes_to_colours(Array(9).fill(0.8))
        // Flatten positions and colours
        colours = colours.concat(node_colours.flat())
        positions = positions.concat(led_nodes[i].positions.flatMap(x => x.toArray()))
    }

    // Apply positions and colours to led particle geometry
    led_particle_geo.setAttribute('color', new THREE.Float32BufferAttribute(colours, 3).setUsage(THREE.DynamicDrawUsage))
    led_particle_geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    var ledparticles = new THREE.Points(led_particle_geo, ledsmaterial)
    scene.add(ledparticles);
    animate()
}
// --- Load Config File ---
function load_from_file(){

    var loader = new THREE.FileLoader();
    loader.load('test.config', ( data ) => {
        const config = JSON.parse(data)
        // Only load the first chain
        const verts = config.vertex_positions[0]
        const leds = config.led_positions[0]

        verts.forEach((v, i) => {
            console.log(v, i)
            let node = new LEDNode(new THREE.Vector3(...v))
            node.positions = leds[i].map(p => new THREE.Vector3(...p))
            led_nodes.push(node)
        })

        for (var i = 0; i < led_nodes.length; i++){
            // Set all LEDs to 0.8 brightness
            let node_colours = LEDNode.bytes_to_colours(Array(9).fill(0.8))
            // Flatten positions and colours
            colours = colours.concat(node_colours.flat())
            positions = positions.concat(led_nodes[i].positions.flatMap(x => x.toArray()))
        }

        // console.log(colours)

        // Apply positions and colours to led particle geometry
        led_particle_geo.setAttribute('color', new THREE.Float32BufferAttribute(colours, 3).setUsage(THREE.DynamicDrawUsage))
        led_particle_geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
        var ledparticles = new THREE.Points(led_particle_geo, ledsmaterial)
        scene.add(ledparticles);
        animate()
    });
}

// load_from_file()
load_model_dome()

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
var frame = 0
function animate() {
    test_effect(frame)
	requestAnimationFrame( animate )
	renderer.render( scene, camera )
    frame++
}
animate()