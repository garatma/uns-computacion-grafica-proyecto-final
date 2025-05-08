class Picking {

    constructor(canvas, camera) {
        this.canvas = canvas
        this.camera = camera
    }

    // Dispara un Rayo desde la posicion actual de la Camara, en la direccion dada por las coordenadas de pantalla seleccionadas
    // Testea la interseccion del Rayo con los Objetos de la Escena, y retorna el objeto mas cercano.
    // De no existir interseccion con algun objeto, retorna null.
    pick(sceneObjects) {
        const rect = this.canvas.getBoundingClientRect()
        const sx = event.clientX - rect.left
        const sy = event.clientY - rect.top

        // Obtenemos el tamaño en pantalla del canvas
        const displayWidth = rect.width
        const displayHeight = rect.height

        // Obtenemos la matriz de proyeccion de la camara
        const P = this.camera.proyeccion()

        // Transformamos de espacio de pantalla a espacio de camara
        const vx = (+2.0 * sx / displayWidth - 1.0)  / P[0]     // P[0] -> P[0][0]
        const vy = (-2.0 * sy / displayHeight + 1.0) / P[5]     // P[5] -> P[1][1]

        // Definimos el Rayo a enviar en espacio de camara
        const rayOrigin = [0.0, 0.0, 0.0, 1.0]      // w = 1 -> Punto
        const rayDir = [vx, vy, -1.0, 0.0]          // w = 0 -> Direccion

        const V = this.camera.vista()
        const invView = mat4.create()
        mat4.invert(invView, V)

        // Asumimos no hay nada seleccionado al iniciar
        let pickedObject = null

        // Distancia al triangulo mas cercano en pantalla
        let tmin = Infinity

        // Chequeamos si hemos clickeado sobre un objeto, iterando sobre todos los objetos de la escena
        for (let item in sceneObjects) {
            const object = sceneObjects[item]
            // Obtenemos la matriz de modelado del objeto
            const W = object.modelMatrix
            const invWorld = mat4.create()
            mat4.invert(invWorld, W)

            // Transformamos el Rayo al espacio local del objeto
            const toLocal = mat4.create()
            mat4.multiply(toLocal, invWorld, invView)

            const rayOriginL = vec4.create()
            vec4.transformMat4(rayOriginL, rayOrigin, toLocal)
            const rayDirL = vec4.create()
            vec4.transformMat4(rayDirL, rayDir, toLocal)

            const rayOriginL3 = [rayOriginL[0], rayOriginL[1], rayOriginL[2]]

            // Normalizamos el Rayo para los test de interseccion
            const rayDirL3 = vec3.create()
            vec3.normalize(rayDirL3, [rayDirL[0], rayDirL[1], rayDirL[2]])

            /*
                Si el Rayo intersecta la Bounding Box de un objeto, entonces es posible que hayamos seleccionado un triangulo del objeto.
                En ese caso podemos testear la interseccion entre el Rayo y cada triangulo del objeto para asegurarnos.
    
                Si el Rayo NO intersecta la Bounding Box de un objeto, entonces es imposible que hayamos seleccionado el objeto.
                En ese caso no nos gastamos en testear la interseccion entre el Rayo y los triangulos del objeto.
            */
            const dist = this.intersectRayAABB([], rayOriginL3, rayDirL3, [object.boundingBox.vMin, object.boundingBox.vMax])
            if (dist != null) {
                // console.log('Bounding Box Hit')
                const vertices = object.geometryData.positions
                const indices = object.geometryData.indices
                const triCount = indices.length / 3
                // Debemos encontrar la interseccion Rayo/Triangulo mas cercana
                for (let i = 0; i < triCount; ++i) {
                    // Indices de este triangulo
                    const i0 = indices[i * 3 + 0]
                    const i1 = indices[i * 3 + 1]
                    const i2 = indices[i * 3 + 2]
                    // console.log("i0: " + i0 + " i1: " + i1 + " i2: " + i2)

                    // Vertices de este triangulo
                    const v0 = [vertices[i0 * 3 + 0], vertices[i0 * 3 + 1], vertices[i0 * 3 + 2]]
                    const v1 = [vertices[i1 * 3 + 0], vertices[i1 * 3 + 1], vertices[i1 * 3 + 2]]
                    const v2 = [vertices[i2 * 3 + 0], vertices[i2 * 3 + 1], vertices[i2 * 3 + 2]]
                    // console.log("v0: " + v0 + " v1: " + v1 + " v2: " + v2)

                    // Debemos iterar sobre todos los triangulos para poder encontrar la interseccion mas cercana
                    let t = this.intersectTriangle([], rayOriginL3, rayDirL3, [v0, v1, v2])
                    if (t != null && t < tmin) {
                        // Este es nuestro nuevo triangulo mas cercano
                        tmin = t
                        // Y por ende, el objeto mas cercano
                        pickedObject = object

                    }
                }
            }
        }
        return pickedObject
    }

    // Determina si el Rayo (origen, destino) intersecta con el Axis Aligned Bounding Box
    // Si no ocurre una interseccion, retorna null. 
    // De lo contrario, el punto de interseccion es almacenado en 'out' y la distancia es retornada
    // https://github.com/stackgl/ray-aabb-intersection
    intersectRayAABB(out, ro, rd, aabb) {
        var d = this.distance(ro, rd, aabb)

        if (d === Infinity || d < 0) {
            out = null
        } else {
            out = out || []
            for (var i = 0; i < ro.length; i++) {
                out[i] = ro[i] + rd[i] * d
            }
        }

        return d
    }

    distance(ro, rd, aabb) {
        var dims = ro.length
        var lo = -Infinity
        var hi = +Infinity

        for (var i = 0; i < dims; i++) {
            var dimLo = (aabb[0][i] - ro[i]) / rd[i]
            var dimHi = (aabb[1][i] - ro[i]) / rd[i]

            if (dimLo > dimHi) {
                var tmp = dimLo
                dimLo = dimHi
                dimHi = tmp
            }

            if (dimHi < lo || dimLo > hi) {
                return Infinity
            }

            if (dimLo > lo) lo = dimLo
            if (dimHi < hi) hi = dimHi
        }

        return lo > hi ? Infinity : lo
    }

    // Determina si el Rayo (origen, destino) intersecta con el Triangulo [v0, v1, v2]
    // Si no ocurre una interseccion, retorna null. 
    // De lo contrario, el punto de interseccion es almacenado en 'out' y la distancia es retornada
    // https://github.com/substack/ray-triangle-intersection
    intersectTriangle(out, pt, dir, tri) {
        var EPSILON = 0.000001
        var edge1 = [0, 0, 0]
        var edge2 = [0, 0, 0]
        var tvec = [0, 0, 0]
        var pvec = [0, 0, 0]
        var qvec = [0, 0, 0]

        vec3.sub(edge1, tri[1], tri[0])
        vec3.sub(edge2, tri[2], tri[0])

        vec3.cross(pvec, dir, edge2)
        const det = vec3.dot(edge1, pvec)

        if (det < EPSILON) return null
        vec3.sub(tvec, pt, tri[0])
        const u = vec3.dot(tvec, pvec)
        if (u < 0 || u > det) return null
        vec3.cross(qvec, tvec, edge1)
        const v = vec3.dot(dir, qvec)
        if (v < 0 || u + v > det) return null
        
        const t = vec3.dot(edge2, qvec) / det
        out[0] = pt[0] + t * dir[0]
        out[1] = pt[1] + t * dir[1]
        out[2] = pt[2] + t * dir[2]
        
        return vec3.dist(out, pt);
    }
}
