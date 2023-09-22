const TWO_PI = Math.PI * 2
export function segment_spin_px(node_index, node, progress, segment_angle){
    // Angle to this node in XZ plane
    let node_angle = Math.atan2(node.pos.z, node.pos.x)
    // effect angle of the current frame
    let effect_angle = (progress%1) * TWO_PI

    // Difference between the angles
    // i.e. the offset of this node from the current angle
    let offset = (effect_angle - node_angle)

    // Set brightness based on position & angle
    let brightness = (offset+TWO_PI)%TWO_PI < segment_angle ? 1 : 0

    // // Override to only the middle 2m of the dome
    // if(Math.abs(node.pos.y) > 1) brightness = 0
    let output = Array(9).fill(0)
    output[Math.floor(progress%9)] = brightness 
    return output 
}

export function snake(node_index, node, frame){
    // Set brightness based on position & angle
    let brightness = frame % 200 == node_index ? 1 : 0.3
    return Array(9).fill(brightness)
}

// input: h in [0,360] and s,v in [0,1] - output: r,g,b in [0,1]
function hsv2rgb(h,s,v) {                              
  let f= (n,k=(n+h/60)%6) => v - v*s*Math.max( Math.min(k,4-k,1), 0);     
  return [f(5),f(3),f(1)];       
}  

export function rainbow_spiral(node_index, node, progress){
    // Angle to this node in XZ plane
    let node_angle = Math.atan2(node.pos.z, node.pos.x)/TWO_PI
    let hue = (node_angle + progress + node.pos.y/2)%1*360

    let rgb = hsv2rgb(hue, 1, 1)

    // // Override to only the middle 2m of the dome
    // if(Math.abs(node.pos.y) > 1) brightness = 0
    return rgb.concat(Array(6).fill(0)) 
}