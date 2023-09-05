# LightStageJS
LightStageJS is a browser & code based tool used to configure, preview and control the new Light Stage for UoY's VGL research group. The tool consists of 2 separate interfaces: Configurator and Visualiser.

## Visualiser
The visualiser part of LightStageJS can be used to preview lighting effects in the browser before running them on the physical stage. The `LightingInterface` class manages the display, but also maintains a byte-array representation of the current state of the stage. This means it can be easily exported to the real dome. The Lighting Interface class can be updated either by individual nodes, with a byte-array, or with a parametric function using the `effect` method.

`effect` expects a function that accepts an index, an LEDNode object, and an arbitrary number of additional parameters the user can pass in to control the effect. For example, the following function :

```JavaScript
export function red_hemisphere(node_index, node){
    // Set brightness based on position & angle
    let brightness = node.pos.x > 0 ? 1 : 0
    return [brightness,0,0,0,0,0,0,0,0]
}

// Initialize the lighting interface and load the default dome geometry
let dome = new LightingInterface()
dome.load_geo_dome(2,1.5)
dome.init_particles(scene)

// Run the parametric effect and update the dome lighting
dome.effect(red_hemisphere)
```

Future plans include a way to connect to the physical dome via this interface and send commands live over the network. Potential extensions would allow for choreographing sequences of lighting configurations and camera activations using the dome control server (seperate application)

## Configurator
The configurator is used to generate a config file that represents the light stage. This file takes the following format:

```
{
    byte_order: "RGBW...",
    vertex_positions: [
        [[x,y,z], [x,y,z], ...],
        [[x,y,z], [x,y,z], ...],
        ...
    ],
    led_positions: [
        [[[x,y,z], [x,y,z],...], [[x,y,z], [x,y,z],...]],
        [[[x,y,z], [x,y,z],...], [[x,y,z], [x,y,z],...]],
        ...
    ]
}
```

`byte_order` represents the colours controlled by each byte sent to a node (e.g. "RGB" means the first byte will turn on the Red led, second will turn on the Blue, etc)

`vertex_positions` are the vertexes where each node is mounted

`led_positions` are lists of the positions of leds, seperated by node

Both `*_positions` properties can have multiple arrays, representing multiple controllers. However, the light stage currently only has one controller so these aren't currently used

### Config Generation
Presently, the configurator automatically generates a geodesic dome of the specified size (by subdividing an icosahedron). It then displays these nodes in the UI, and the user can click through the sequence to show how the LEDs are connected on the light stage.

Once the configuration is complete, the user can export the configuration, which will be printed to the console.

### Modification / Development
The file `geometry.js` contains the code to generate the geodesic dome. In theory, any geometry can be used and passed along to the configurator as long as the format used in the dome class is maintained. All that's needed is a property `this.verts`: a list of `THREE.Vector3` coordinates.

The configuration of the nodes themselves can be changed in `led_node.js`. The important variables here are:
- `LED_LAYOUT` which tells the program where on the node each LED is, offset from the center of the node in mm. 
- `BYTE_ORDER` configures what order the individual LEDs are connected.
- `bytes_to_colors` has a switch statement that specifies how to translate each LED to RGB for the visualizer 

The project should run locally without any dependencies as all external libraries are loaded via CDN