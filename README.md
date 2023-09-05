# LightStageJS
LightStageJS is a browser & code based tool used to configure, preview and control the new Light Stage for UoY's VGL research group. The tool consists of 2 separate interfaces: Configurator and Visualiser.

## Configurator
The configurator is used to generate a config file that represents the light stage. This file takes the following format:

```JSON
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