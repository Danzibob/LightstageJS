import * as THREE from 'three'

const LED_LAYOUT = {
    "R": [0,6],     // Red
    "G": [-14,0],   // Green
    "B": [-14,16],  // Blue
    "W": [14,16],   // Warm White
    "N": [0,22],    // Neutral White
    "C": [14,0],    // Circularly Polarised (Cool White)
    "V": [14,-16],  // Vertically Polarised (Cool White)
    "H": [0,-10],   // Horizontally  Polarised (Cool White)
    "D": [-14,-16]  // Diagonally (45 degree) Polarised (Cool White)
}
const NUM_LEDS = Object.keys(LED_LAYOUT).length
export const BYTE_ORDER = "RGBCWNVHD"
console.assert(BYTE_ORDER.length == NUM_LEDS)

// Convert LED layout to vectors
for(let k of BYTE_ORDER){
    LED_LAYOUT[k] = new THREE.Vector3(0, LED_LAYOUT[k][1]/1000, LED_LAYOUT[k][0]/1000)
}

export class LEDNode {
	constructor(pos){
        this.pos = pos
        const euler = rotate_towards(pos)
        // Apply calculated transformation to each LED position
        this.positions = []
        for(let k of BYTE_ORDER){
            this.positions.push(LED_LAYOUT[k].clone().setX(pos.length()).applyEuler(euler))
        }
    }

    // Convert an N byte array to N RGB colors
    static bytes_to_colors(arr){
        let colors = []
        for(let i=0; i<NUM_LEDS; i++){
            let v = arr[i]
            switch (BYTE_ORDER[i]){
                case "R": colors.push([v,0,0]); break
                case "G": colors.push([0,v,0]); break
                case "B": colors.push([0,0,v]); break
                case "W": colors.push([v,v,v * 0.7]); break
                case "N": colors.push([v,v,v * 0.9]); break
                default : colors.push([v,v,v])
            }
        }
        return colors
    }
}


function rotate_towards(pos){
    const r = pos.length()
        // Theta is rotation around Y
        const theta = Math.atan2(pos.z, pos.x)
        // Phi is rotation around z
        const phi = Math.asin(pos.y/r)

        // in order to preserve orientation, rotate around y axis, then z
        const euler = new THREE.Euler(0, theta, phi, 'YZX');
        return euler
}