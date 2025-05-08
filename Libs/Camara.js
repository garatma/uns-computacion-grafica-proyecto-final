class Camara {

    // construye la cámara con valores por defecto
    constructor(registerZone) {
        this.r = 90;
        this.t = 60*Math.PI/180;
        this.f = 40*Math.PI/180;
        this.matriz_vista = mat4.create();

        this.traslacion = [0,0,0];
        this.rotacion = [0,0];
        this.direccion = [0,0,-1];
        this.posicion = [0,0,0];

        this.fovy = 60*Math.PI/180; 
        this.aspect = 1;
        this.zNear = 0.1;
        this.zFar = 1000;
        this.matriz_proyeccion = mat4.create();

        this.ultima_traslacion = [0,0,0];

        // controles mouse.

        this.dragFactor    = 0.01  // sensibilidad del drag
        this.zoomFactor    = 0.01   // sensibilidad del zoom
        this.dragging      = false
        this.lastX         = 0
        this.lastY         = 0
        this.registerZone  = registerZone

        this.registerZone.onwheel = function(event){ event.preventDefault(); };

        this.registerZone.onmousewheel = function(event){ event.preventDefault(); };

        this.registerZone.addEventListener("wheel", (event) => { this.zoom_mouse(event) }, { passive: true })
        this.registerZone.addEventListener("mousedown", (event) => { this.drag_start(event) })
        this.registerZone.addEventListener("context", (event) => { this.drag_start(event) })
        document.addEventListener("mousemove", (event) => { this.drag_move(event) })
        document.addEventListener("mouseup", () => { this.drag_end() })
        let browser = get_browser().name
        if ( browser == "Firefox" ) this.zoomFactor = 0.1;
        else this.zoomFactor = 0.007 
        this.it = 0;
    }

    // crea y retorna la matriz de proyección
    proyeccion() {
        mat4.perspective(this.matriz_proyeccion, this.fovy, this.aspect, this.zNear, this.zFar);
        return this.matriz_proyeccion;
    }

    // crea y retorna la matriz de vista
    vista() { 
        this.matriz_vista = mat4.create();

        let cuaternion_rotacion = quat.create();
        quat.rotateX(cuaternion_rotacion, cuaternion_rotacion, this.rotacion[1]);
        quat.rotateY(cuaternion_rotacion, cuaternion_rotacion, -this.rotacion[0]);

        let matriz_rotacion = mat4.create();
        mat4.fromQuat(matriz_rotacion, cuaternion_rotacion);


        this.posicion[0] += this.traslacion[0] * Math.sin(this.rotacion[0]) + this.traslacion[2] * Math.sin(this.rotacion[0]+Math.PI/2);
        this.posicion[1] += this.traslacion[1];
        this.posicion[2] += this.traslacion[0] * Math.cos(this.rotacion[0]) + this.traslacion[2] * Math.cos(this.rotacion[0]+Math.PI/2);
        this.traslacion = [0,0,0];


        let matriz_traslacion = mat4.create();
        mat4.fromTranslation(matriz_traslacion, this.posicion);
        mat4.multiply(this.matriz_vista, matriz_rotacion, matriz_traslacion);

        return this.matriz_vista; 
    }

    left_right(delta) { this.traslacion[0] = delta; }

    up_down(delta) { this.traslacion[1] = delta; }

    forwards_backwards(delta) { this.traslacion[2] = delta; }

    // rotar en X (fi)
    pitch(delta) { 
        this.rotacion[1] += delta; 
        let direccion_esferica = Utils.cartesianas_a_esfericas(this.direccion);
        direccion_esferica[2] += delta;
        this.direccion = Utils.esfericas_a_cartesianas(direccion_esferica);
    }

    // rotar en Y (tita)
    yaw(delta) { 
        this.rotacion[0] += delta; 
        let direccion_esferica = Utils.cartesianas_a_esfericas(this.direccion);
        direccion_esferica[1] += delta;
        this.direccion = Utils.esfericas_a_cartesianas(direccion_esferica);
    }

    zoom_mouse(event) { this.left_right(-event.deltaY * this.zoomFactor) }

    drag_start(event) {
        event.preventDefault()
        const click = event.buttons;

        if ( click == 1 || click == 2 ) {
            this.dragging = true
            this.lastX    = event.clientX
            this.lastY    = event.clientY
        }
    }

    drag_move(event) {
        event.preventDefault()
        if (this.dragging) {
            const mouseChangeX = (event.clientX - this.lastX)
            const mouseChangeY = (event.clientY - this.lastY)
            const click = event.buttons;

            if ( click == 1 ) {
                // funciones de rotacion
                this.yaw(-mouseChangeX * this.dragFactor);
                this.pitch(mouseChangeY * this.dragFactor);
            }
            else if ( click == 2 ) {
                this.forwards_backwards(-mouseChangeX * this.dragFactor*5);
                this.up_down(-mouseChangeY * this.dragFactor*5);
            }

            this.lastX = event.clientX
            this.lastY = event.clientY
        }
    }

    drag_end() { this.dragging = false }
}


function get_browser() {
    var ua=navigator.userAgent,tem,M=ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || []; 
    if(/trident/i.test(M[1])){
        tem=/\brv[ :]+(\d+)/g.exec(ua) || []; 
        return {name:'IE',version:(tem[1]||'')};
        }   
    if(M[1]==='Chrome'){
        tem=ua.match(/\bOPR|Edge\/(\d+)/)
        if(tem!=null)   {return {name:'Opera', version:tem[1]};}
        }   
    M=M[2]? [M[1], M[2]]: [navigator.appName, navigator.appVersion, '-?'];
    if((tem=ua.match(/version\/(\d+)/i))!=null) {M.splice(1,1,tem[1]);}
    return {
        name: M[0],
        version: M[1]
    };
}