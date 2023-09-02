import * as THREE from 'three'

const phi = (1 + Math.sqrt(5)) / 2;
const ICOSAHEDRON = {
    verts: ([
        [-1.0, 0.0, phi], [ 1.0, 0.0,  phi], [-1.0, 0.0, -phi], [1.0, 0.0,  -phi],
        [ 0.0, phi, 1.0], [ 0.0, phi, -1.0], [0.0, -phi,  1.0], [0.0, -phi, -1.0],
        [ phi, 1.0, 0.0], [-phi, 1.0,  0.0], [phi, -1.0,  0.0], [-phi, -1.0, 0.0]
    ]).map(v => new THREE.Vector3().fromArray(v).normalize()),
    faces: [
        [0, 4,  1], [0, 9, 4 ], [9,  5, 4], [ 4, 5, 8 ], [ 4, 8, 1 ],
        [8, 10, 1], [8, 3, 10], [5,  3, 8], [ 5, 2, 3 ], [ 2, 7, 3 ],
        [7, 10, 3], [7, 6, 10], [7, 11, 6], [11, 0, 6 ], [ 0, 1, 6 ],
        [6, 1, 10], [9, 0, 11], [9, 11, 2], [ 9, 2, 5 ], [ 7, 2, 11]
    ]
}

export class GeoDome_Geometry {
    constructor(order, scale){
        // Subdivide every face to generate the remaining points
        this.verts = []
        for(let f of ICOSAHEDRON.faces){
            this.subdivide(...f.map(idx => ICOSAHEDRON.verts[idx]), order)
        }

        // Make the top vertex the center of the pentagonal section & scale
        let angle = this.verts[41].angleTo(new THREE.Vector3(0,1,0))
        let ax = new THREE.Vector3(0,0,1)
        this.verts.forEach(v => v.applyAxisAngle(ax,angle))

        // Cut off bottom of sphere to make DOME
        this.verts = this.verts.filter(v => v.y >= -0.9)

        // Apply scale factor
        this.verts = this.verts.map(v => v.multiplyScalar(scale))
    }

    addPoint(new_point){
        if(!this.verts.find(x => x.equals(new_point))) 
            this.verts.push(new_point)
    }

    // Split triangle into moar triangles
    subdivide(vec1, vec2, vec3, depth){
        let v1 = vec1.clone()
        let v2 = vec2.clone()
        let v3 = vec3.clone()
        if(depth == 0){
            for(let v of [v1,v2,v3]) this.addPoint(v);
            return
        }
        let v12 = new THREE.Vector3().addVectors(v1,v2).normalize()
        let v23 = new THREE.Vector3().addVectors(v2,v3).normalize()
        let v31 = new THREE.Vector3().addVectors(v3,v1).normalize()
        this.subdivide(v1 , v12, v31, depth - 1)
        this.subdivide(v2 , v23, v12, depth - 1)
        this.subdivide(v3 , v31, v23, depth - 1)
        this.subdivide(v12, v23, v31, depth - 1)
    }


}


