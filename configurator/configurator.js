import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as dat from "dat.gui"
import { GeoDome_Geometry} from 'geometry'
import { LEDNode, BYTE_ORDER} from 'led_node'

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

scene.add(new THREE.AmbientLight( 0xaaaaaa )) // soft white ambient light
const light = new THREE.PointLight( 0xffffff, 10, 100 );
light.position.set( 0,0,0 );
scene.add( light );

const BASE_COLOR = 0x888888
const HOVER_COLOR = 0x22cc00
const nodeCollisionMesh = new THREE.CylinderGeometry(0.08,0.08,0.05,9)
const nodeMeshMaterial = new THREE.MeshPhongMaterial({color: BASE_COLOR})
const UP = new THREE.Vector3(0, 1, 0);

function initialize_configurator(scene){
    // Step 1: Get dome dimensions &04040 style from user
    // (use prompt or something)
    const DOME_RADIUS = 1.5
    const DOME_ORDER = 2

    // Step 2: Generate theoretical dome geometry
    const DOME = new GeoDome_Geometry(DOME_ORDER, DOME_RADIUS)
    const LED_NODES = DOME.verts.map(v => new LEDNode(v))

    // Step 2.5: create meshes for each node
    const NODE_MESHES = []
    LED_NODES.forEach((v,i) => {
        // Create the mesh object
        let node_mesh = new THREE.Mesh(
            nodeCollisionMesh.clone(),
            nodeMeshMaterial.clone())
        // Rotate the mesh into place
        node_mesh.position.set(v.pos.x, v.pos.y, v.pos.z)
        let D = v.pos.clone().setY(Math.abs(v.pos.y)).normalize()
        let axis = new THREE.Vector3().crossVectors(UP, D);
        let angle = Math.acos(UP.dot(D));
        angle = v.pos.y > 0 ? angle : -angle
        node_mesh.rotateOnAxis(axis, angle)

        NODE_MESHES.push(node_mesh)
        scene.add(node_mesh)
    })


    // Step 3: Initialize configuration object
    const CONFIG = new Configuration(LED_NODES)
    CONFIG.create_gui()

    // Step 4: Load dome graphics & set up interface

    // Initialize mouse raycasting
    var mouse = new THREE.Vector2()
    var raycaster = new THREE.Raycaster()
    let last_hover = 0
    document.onmousemove = function(e){
        mouse.x = ( e.clientX / renderer.domElement.clientWidth ) * 2 - 1
        mouse.y = -( e.clientY / renderer.domElement.clientHeight ) * 2 + 1
        raycaster.setFromCamera(mouse, camera)
        let objects = raycaster.intersectObjects(NODE_MESHES, true)

        // if the ray hit an object, highlight it
        if(objects[0]){
            let hovered = NODE_MESHES.indexOf(objects[0].object)
            if(last_hover != hovered){
                NODE_MESHES[hovered].material.color.setHex(HOVER_COLOR)
                if(last_hover > -1) NODE_MESHES[last_hover].material.color.setHex(BASE_COLOR)
            }
            last_hover = hovered
        } else {
            if(last_hover > -1) NODE_MESHES[last_hover].material.color.setHex(BASE_COLOR)
            last_hover = -1
        }
        
    }
    document.onclick = function(e){
        console.log(last_hover)
        if(last_hover > -1){
            CONFIG.add_node_to_active(last_hover)
            let pos = NODE_MESHES[last_hover].position
            console.log(pos)
            NODE_MESHES[last_hover].position.set(pos.x*0.6, pos.y*0.6, pos.z*0.6)
        }
    }

    function set_up_configurator_scene(scene){
        
    }
}


// Holds user-entered led control chains
// Controlled by Configurator UI
class Configuration{
    constructor(geometry){
        this.geometry = geometry
        this.chains = [[]]
        this.active_chain = 0
    }

    create_gui(){
        this.gui = new dat.GUI()
        this.gui.add(this, "active_chain", 0, this.chains.length-1, 1)
        this.gui.add(this, "shorten_active").name("Remove Last Node")
        this.gui.add(this, "add_chain").name("Create New Chain")
        this.gui.add(this, "del_chain").name("Delete Active Chain")
        this.gui.add(this, "export").name("Export Configuration")
    }

    // Adds a new chain
    add_chain(){
        this.chains.push([])
        this.active_chain = this.chains.length
    }

    // Deletes the chain of the ID provided
    del_chain(){
        if(confirm("Are you sure you want to delete chain " + chainID + "?")){
            this.chains.splice(chainID,1)
            this.active_chain = 0
        }
    }

    // Adds the provided nodeID to the currently active chain
    add_node_to_active(nodeID){
        // Prevent a node from being added if it's
        // already in an existing chain
        if(this.chains.flat().indexOf(nodeID) != -1)
            console.log("Node is already part of a chain!")
        else
            this.chains[this.active_chain].push(nodeID)
    }

    // Removes the last node from the currently active chain
    shorten_active(){
        this.chains[this.active_chain].pop()
    }

    // Export the configuration data as a JSON file
    export(){
        console.log(this.geometry)
        let export_object = {
            byte_order: BYTE_ORDER, //Channel order within each node
            vertex_positions: this.chains.map(chain => 
                chain.map(nodeID => 
                    this.geometry[nodeID].pos.toArray()
                )),
            led_positions: this.chains.map(chain => 
                chain.map(nodeID => 
                    this.geometry[nodeID].positions.map(pos => 
                        pos.toArray()    
                    )
                ))
        }
        console.log(export_object)
        return export_object
    }
}

initialize_configurator(scene)
let frame = 0
function animate() {
	requestAnimationFrame( animate )
	renderer.render( scene, camera )
    frame++
}
animate()