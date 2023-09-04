export function segment_spin_px(node, effect_angle, segment_angle){
    // Angle to this node in XZ plane
    let node_angle = Math.atan2(node.pos.z, node.pos.x) + Math.PI

    // Difference between the angles
    // i.e. the offset of this node
    let offset = (node_angle - effect_angle + Math.PI*2) % (Math.PI*2)

    // Set brighness based on position & angle
    let brightness = offset < segment_angle ? 1 : 0

    // Override to only the middle 2m of the dome
    if(Math.abs(node.pos.y) > 1) brightness = 0

    return Array(9).fill(brightness)
}