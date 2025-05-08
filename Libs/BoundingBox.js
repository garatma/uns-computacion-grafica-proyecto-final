 class BoundingBox {
    constructor(geometryData) {
        const minVec3 = [+Infinity, +Infinity, +Infinity]
        const maxVec3 = [-Infinity, -Infinity, -Infinity]

        this.vMin = minVec3
        this.vMax = maxVec3

        const vertices = geometryData.positions;
        for (let index = 0; index < (vertices.length / 3); index++) {
            const vertex = [vertices[index * 3], vertices[index * 3 + 1], vertices[index * 3 + 2]];
            vec3.min(this.vMin, this.vMin, vertex)
            vec3.max(this.vMax, this.vMax, vertex)
        }
    }
}
