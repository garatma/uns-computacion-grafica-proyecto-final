
class CamaraSombras extends Camara {
        //constructor(radius = 5, theta = -40, phi = 60) {
        constructor(registerZone,radius , theta , phi, fovy, aspect, near, far) {
            super(registerZone);
            //this.defaultSphericalPosition = { radius: radius, theta: toRadians(theta), phi: toRadians(phi) }
            this.sphericalPosition = { radius: radius, theta: theta, phi: phi }

        
            /* 📝 Coordenadas esfericas y convencion de ejes
            radius: distancia al origen
            theta: angulo horizontal alrededor del eje y (partiendo del eje z positivo, en sentido anti-horario)
            phi: angulo vertical desde el eje y positivo
            */

            this.fovy    = fovy
            this.aspect = aspect
            this.near   = near
            this.far    = far

            this.onPositionChange = () => {} // funcion que se ejecuta ante cada cambio en la posicion de la camara (por defecto una "funcion vacia" o no-op)

        // this.viewMatrix = mat4.create()
        // this.projectionMatrix = mat4.create()
    }

    // Setters & Getters

    set radius(value) {
        this.sphericalPosition.radius = limitToRange(value, this.near, this.far) // radius: [near, far]
        vista();
        this.onPositionChange(this.sphericalPosition)
    }
    get radius() {
        return this.sphericalPosition.radius
    }

    set theta(value) {
        this.sphericalPosition.theta = ( value === Math.PI * 2 ) ? value : ( value + Math.PI * 2 ) % ( Math.PI * 2 ) // theta: [0, 360]
        vista()
        this.onPositionChange(this.sphericalPosition)
    }
    get theta() {
        return this.sphericalPosition.theta
    }

    set phi(value) {
        this.sphericalPosition.phi = limitToRange(value, 0, Math.PI) // phi: [0, 180]
        proyeccion()
        this.onPositionChange(this.sphericalPosition)
    }
    get phi() {
        return this.sphericalPosition.phi
    }

    // Actualizacion de matrices

   /* updateViewMatrix() {
        const angleAroundX = Math.PI / 2 - this.sphericalPosition.phi   // [0, 180] -> ± [0, 90]
        const angleAroundY = - this.sphericalPosition.theta             // [0, 360] -> - [0, 360]

        const rotations = quat.create()                     // creamos un cuaternion 'identidad' (i.e. representa una rotacion nula)
        quat.rotateX(rotations, rotations, angleAroundX)    // en el que almacenamos la rotacion alrededor del eje x
        quat.rotateY(rotations, rotations, angleAroundY)    // y la rotacion alrededor del eje y

        const rotationMatrix = mat4.create()
        mat4.fromQuat(rotationMatrix, rotations)

        const translationMatrix = mat4.create()
        mat4.fromTranslation(translationMatrix, [0, 0, - this.sphericalPosition.radius])

        mat4.multiply(this.viewMatrix, translationMatrix, rotationMatrix)
    }

    proyeccion() {
        mat4.perspective(this.projectionMatrix, this.fov, this.aspect, this.near, this.far)
        return this.projectionMatrix
    } */

    /* 📝 Movimientos de camara
     Dolly in|out - Acerca|aleja a la camara de su objetivo (equivale a disminuir|aumentar el radio)
     Arco horizontal|vertical - Mueve a la camara alrededor de su objetivo en forma circular (equivale a modificar los valores de theta|phi)
     */

    dolly(value) {
        this.radius = this.radius - value
    }

    arcVertically(value) {
        this.phi = this.phi - value
    }

    arcHorizontally(value) {
        this.theta = this.theta + value
    }

    reset() {
        Object.assing(this.sphericalPosition, this.defaultSphericalPosition)
        this.onPositionChange(this.sphericalPosition)
        vista()
    }
}