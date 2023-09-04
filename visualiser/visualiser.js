import * as THREE from 'three'
import { LEDNode } from '/lib/led_node.js'
import { GeoDome_Geometry} from '/lib/geometry.js'

const PRE_INIT = 0
const DATA_LOADED = 1
const INITIALISED = 2


// A "Fake Dome" interface that can be set per node or with a full byte control array
// Converts this to either THREE.js buffers, animation files or control packets
export class LightingInterface{
    constructor(){
        this.init_stage = PRE_INIT
        this.nodes = []
    }

    verify_init_stage(stage, action){
        console.assert(
            this.init_stage == stage,
            `Stage when ${action} should be ${stage}, but was ${this.init_stage}`
        )
    }

    // Loads the interface with a mathematically generated dome layout
    load_geo_dome(dome_order, dome_radius) {
        // Warn user if geometry is already loaded
        this.verify_init_stage(PRE_INIT, "loading dome model")

        // Generate dome config
        const geo_dome = new GeoDome_Geometry(2, 1.5)
        // Create LEDNode objects from this config
        this.nodes = geo_dome.verts.map(v => new LEDNode(v))

        // Update Initialization
        this.init_stage = DATA_LOADED
    }

    // Loads the interface with a geometry from a config file
    async load_geo_from_file(path) {
        // Warn user if geometry is already loaded
        this.verify_init_stage(PRE_INIT, "loading model from file")

        // Fail out if geometry is already loaded
        console.assert(this.init_stage == 0, 
            "Stage when loading should be 0, was %d", this.init_stage)
        // load a file asynchronously
        let data
        try {
            data = await new Promise((resolve, reject) => {
                const loader = new THREE.FileLoader();
                loader.load(path, resolve, null, reject)
            });
        } catch {
            return console.error("Failed to load file specified!")
        }
        // Parse JSON data
        const config = JSON.parse(data)
        console.debug(config)

        // File format supports multiple controllers, currently
        // we only support one here. Get first controller
        const verts = config.vertex_positions[0]
        const leds = config.led_positions[0]

        verts.forEach((v, i) => {
            let node = new LEDNode(new THREE.Vector3(...v))
            node.positions = leds[i].map(p => new THREE.Vector3(...p))
            this.nodes.push(node)
        })

        // Update Initialization
        this.init_stage = DATA_LOADED
    }

    // Create particle objects and initialise to off
    // Initialize all LEDs as off & parse positions
    init_particles(scene) {
        // Warn user if geometry isn't yet loaded
        this.verify_init_stage(DATA_LOADED, "initializing particles")

        // Get positions from nodes list
        var positions = this.nodes.flatMap(n => n.positions.flatMap(x => x.toArray()))
        var colors = Array(positions.length).fill(0.0)
        
        // Also create internal color data list
        this.led_values = Array(9 * this.nodes.length).fill(0.0)

        // Apply positions and colors to led particle geometry
        this.led_geom = new THREE.BufferGeometry()
        this.led_geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3).setUsage(THREE.DynamicDrawUsage))
        this.led_geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
        
        // Create the objects and add them to the scene
        this.scene_objects = new THREE.Points(this.led_geom, ledsmaterial)
        scene.add(this.scene_objects)

        // Update Initialization
        this.init_stage = INITIALISED
    }

    // Sets a node's color based on a [node_size] byte array
    // updates internal representation and visualisation
    set_node(i, data, update){
        // TODO: fix hard-coded number of LEDs per node
        this.led_values.splice(i*9, 9, ...data)
        // Convert node data to rgb colors for display
        let rgb_colors = LEDNode.bytes_to_colors(data).flat()
        // Write this to the particle object
        rgb_colors.forEach((color_component, idx) => 
            this.led_geom.attributes.color.array[i*27+idx] = color_component
        )
        // Update only if required
        if(update) this.update()
    }

    // Runs a function on every node to calculate the lighting values
    // updates once every node has been recalculated
    effect(func, ...params){
        this.nodes.forEach((node, idx) => {
            let node_values = func(idx, node, ...params)
            this.set_node(idx, node_values, false)
        })
        this.update()
    }

    // Updates node colors for the visualization
    update() {
        this.led_geom.attributes.color.needsUpdate = true
    }

    // Exports the current configuration to a string
    export_current_frame(){
        return this.nodes.reduce((export_str, _, i) => {
            let node_values = this.led_values.slice(i*9, i*9 + 9)
                                .map(v => Math.round(v*255))
            return export_str + `${i}\t${node_values.join("\t")}\n`
        }, "")
    }
}


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
	spark:   { value: new THREE.TextureLoader().load( "/spark1.png" ) }
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
