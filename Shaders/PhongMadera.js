class PhongMadera {

    constructor(gl) {
        this.gl = gl;

        this.shader_program = ShaderProgramHelper.create(this.vertex(), this.fragment());

        this.u_matriz_vista = this.gl.getUniformLocation(this.shader_program, 'viewMatrix');
        this.u_matriz_proyeccion = this.gl.getUniformLocation(this.shader_program, 'projectionMatrix');
        this.u_matriz_normal = this.gl.getUniformLocation(this.shader_program,'normalMatrix');
        this.u_matriz_modelo = this.gl.getUniformLocation(this.shader_program, 'modelMatrix');
        this.u_matriz_luz_vista = this.gl.getUniformLocation(this.shader_program, 'lightViewMatrix');
        this.u_matriz_luz_proyeccion = this.gl.getUniformLocation(this.shader_program, 'lightProjectionMatrix');
        this.u_mapa_de_sombra = this.gl.getUniformLocation(this.shader_program, 'shadowMap');

        this.loc_normal = this.gl.getAttribLocation(this.shader_program, 'vertexNormal');
        this.loc_posicion = this.gl.getAttribLocation(this.shader_program, 'vertexPosition');
        this.loc_textura = this.gl.getAttribLocation(this.shader_program, 'vertexTextureCoordinates');

        this.u_ambiente = this.gl.getUniformLocation(this.shader_program,"ambiente");
        
        this.u_posicion0 = this.gl.getUniformLocation(this.shader_program, "posicion0");
        this.u_intensidad0 = this.gl.getUniformLocation(this.shader_program, "intensidad0");
        this.u_atenuacion0 = this.gl.getUniformLocation(this.shader_program, "atenuacion0");
        this.u_posicion1 = this.gl.getUniformLocation(this.shader_program, "posicion1");
        this.u_intensidad1 = this.gl.getUniformLocation(this.shader_program, "intensidad1");
        this.u_atenuacion1 = this.gl.getUniformLocation(this.shader_program, "atenuacion1");

        this.u_tiene_sombra = this.gl.getUniformLocation(this.shader_program,"tiene_sombra");

        this.u_ka = this.gl.getUniformLocation(this.shader_program,"ka");
        this.u_kd = this.gl.getUniformLocation(this.shader_program,"kd");
        this.u_ks = this.gl.getUniformLocation(this.shader_program,"ks");
        this.u_n = this.gl.getUniformLocation(this.shader_program,"n");

        this.u_ganancia = this.gl.getUniformLocation(this.shader_program,"gain");
        this.u_lacunaridad = this.gl.getUniformLocation(this.shader_program,"lacunarity");
        this.u_octavas = this.gl.getUniformLocation(this.shader_program,"octavas");
        this.u_resolution = this.gl.getUniformLocation(this.shader_program,"u_resolution");

    }

    set_luz(ambiente, luces) {
        this.gl.uniform3f(this.u_intensidad_ambiente , ambiente[0], ambiente[1], ambiente[2]);
        
        this.gl.uniform3fv(this.u_posicion0, luces[0].posicion);
        this.gl.uniform3fv(this.u_intensidad0, luces[0].intensidad);
        this.gl.uniform3fv(this.u_atenuacion0, luces[0].atenuacion);
        this.gl.uniform3fv(this.u_posicion1, luces[1].posicion);
        this.gl.uniform3fv(this.u_intensidad1, luces[1].intensidad);
        this.gl.uniform3fv(this.u_atenuacion1, luces[1].atenuacion);
    }

    set_material(material) {
        this.gl.uniform3f(this.u_ka, material.ka[0], material.ka[1], material.ka[2]);
        this.gl.uniform3f(this.u_kd, material.kd[0], material.kd[1], material.kd[2]);
        this.gl.uniform3f(this.u_ks, material.ks[0], material.ks[1], material.ks[2]);
        this.gl.uniform1f(this.u_n, material.n);
        this.gl.uniform2fv(this.u_resolution, material.resolucion);
        this.gl.uniform1f(this.u_octavas,material.octavas);
        this.gl.uniform1f(this.u_lacunaridad,material.lacunaridad);
        this.gl.uniform1f(this.u_ganancia,material.ganancia);
    }

    vertex() {
        return `#version 300 es
        precision mediump int;

        uniform mat4 viewMatrix;
        uniform mat4 projectionMatrix;
        uniform mat4 normalMatrix;
        uniform mat4 modelMatrix;
        uniform mat4 lightViewMatrix;
        uniform mat4 lightProjectionMatrix;

        uniform int tiene_sombra;

        uniform vec3 posicion0;
        uniform vec3 posicion1;
        
        in vec2 vertexTextureCoordinates;
        in vec3 vertexNormal;
        in vec3 vertexPosition;  
        
        out vec4 shadowCoor;
        out vec3 normal;
        out vec3 ojo;
        out vec3 luz0;
        out vec3 luz1;
        out vec2 coordtext;

        const mat4 tMat = mat4(
            0.5, 0.0, 0.0, 0.0,
            0.0, 0.5, 0.0, 0.0,
            0.0, 0.0, 0.5, 0.0,
            0.5, 0.5, 0.5, 1.0
            );


        void main() {
            vec3 vPE = vec3(viewMatrix * modelMatrix * vec4(vertexPosition, 1));
            
            luz0 = vec3(viewMatrix * vec4(posicion0,1));
            luz0 = normalize(vec3(luz0-vPE));
            luz1 = vec3(viewMatrix * vec4(posicion1,1));
            luz1 = normalize(vec3(luz1-vPE));

            normal = normalize(vec3(normalMatrix*vec4(vertexNormal,0)));
            ojo = normalize(-vPE);

            coordtext = vertexTextureCoordinates;
        
            if ( tiene_sombra == 1 ) shadowCoor = tMat * lightProjectionMatrix * lightViewMatrix * modelMatrix * vec4(vertexPosition, 1.0);
            else shadowCoor = vec4(0,0,0,0);

            gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(vertexPosition, 1);
        }
        `;
    }

    fragment() {
        return `#version 300 es
        precision mediump float;
        precision mediump int;
        precision mediump sampler2DShadow;
        
        uniform vec3 ambiente;
        
        uniform int tiene_sombra;

        uniform float n;
        uniform vec3 ka;
        uniform vec3 kd;
        uniform vec3 ks;
        uniform float gain;
        uniform float lacunarity;
        uniform float octavas;
        uniform vec2 u_resolution;
        
        uniform vec3 atenuacion0;
        uniform vec3 intensidad0;
        uniform vec3 atenuacion1;
        uniform vec3 intensidad1;
        
        uniform sampler2DShadow shadowMap;
        
        in vec4 shadowCoor;
        
        in vec3 normal;
        in vec3 ojo;
        in vec3 luz0;
        in vec3 luz1;
        in vec2 coordtext;
        
        out vec4 fragmentColor;
        
        float random (in vec2 coordtext) {
            return fract(sin(dot(coordtext.xy,vec2(12.9898,78.233)))* 43758.5453123);
        }
        
        float noise (in vec2 coordtext) {
            vec2 i = floor(coordtext);
            vec2 f = fract(coordtext);
        
            // Four corners in 2D of a tile
            float a = random(i);
            float b = random(i + vec2(1.0, 0.0));
            float c = random(i + vec2(0.0, 1.0));
            float d = random(i + vec2(1.0, 1.0));
        
            vec2 u = f * f * (3.0 - 2.0 * f);
        
            return mix(a, b, u.x) +
                    (c - a)* u.y * (1.0 - u.x) +
                    (d - b) * u.x * u.y;
        }
        
        float fbm (vec2 coordtext, float gain, float lacunarity, int octaves) {
            // Initial values
            float value = 0.0;
            float amplitud = .5;
            float frequency = 0.;
        
            // Loop of octaves
            for (int i = 0; i < octaves; i++) {
                value += amplitud * noise(coordtext);
                coordtext *= lacunarity;
                amplitud *= gain;
            }
            return value;
        }

        vec3 calcular_termino_difuso_especular(vec3 luz, vec3 atenuacion, vec3 intensidad, vec3 V, vec3 N, vec3 col) {
            vec3 L = normalize(luz);
            vec3 H = normalize(L+V);
            float NL = max(dot(N,L),0.0);
            float NHn = pow(max(dot(N,H),0.0),n);

            float d = length(luz);
            float fatt = 1.0/(1.0+atenuacion.x+atenuacion.y*d+atenuacion.z*d*d);
            
            return fatt*intensidad*(kd*NL*col + ks*NHn);
        }

        void main() {
            float FP = 1.0/2.0;
        
            vec2 st = coordtext;   //gl_FragCoord.xy / u_resolution.xy;
            st.x *= u_resolution.x / u_resolution.y;
            float v = fbm(coordtext.xx * vec2(100.0, 12.0), gain, lacunarity, int(octavas)) ;
            float v0 = smoothstep(-1.0, 1.0, sin(st.x * 14.0 + v * 8.0));
            float v1 = random(coordtext);
            float v2 = noise(coordtext * vec2(200.0, 14.0)) - noise(coordtext * vec2(1000.0, 64.0));
        
            vec3 col = vec3(0.860,0.806,0.574);
            col = mix(col, vec3(0.390,0.265,0.192), v0);
            col = mix(col, vec3(0.930,0.493,0.502), v1 * 0.5);
            col -= v2 * 0.2;
        
            vec3 N = normalize(normal);
            vec3 V = normalize(ojo);
            vec3 difuso_especular = vec3(0,0,0);

            difuso_especular += calcular_termino_difuso_especular(luz0, atenuacion0, intensidad0, V, N, col);
            difuso_especular += calcular_termino_difuso_especular(luz1, atenuacion1, intensidad1, V, N, col);

            float visibility;
            if ( tiene_sombra == 1 ) {
                float sum = 0.0;
                sum += textureProjOffset(shadowMap, shadowCoor, ivec2(-1,-1));
                sum += textureProjOffset(shadowMap, shadowCoor, ivec2(-1,1));
                sum += textureProjOffset(shadowMap, shadowCoor, ivec2(1,1));
                sum += textureProjOffset(shadowMap, shadowCoor, ivec2(1,-1));
                visibility = sum * 0.25;
            }
            else visibility = 1.0;
        
            vec3 iluminacion = ambiente*ka*col + visibility * difuso_especular;
        
            fragmentColor = vec4(iluminacion,1);
           
        }
        `;
    }
}
