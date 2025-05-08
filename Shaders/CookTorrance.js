class CookTorrance {

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

        this.loc_posicion = this.gl.getAttribLocation(this.shader_program, 'vertexPosition');
        this.loc_normal = this.gl.getAttribLocation(this.shader_program, 'vertexNormal');
        this.loc_textura = this.gl.getAttribLocation(this.shader_program, 'vertexTextureCoordinates');

        
        this.u_constante_ambiente = this.gl.getUniformLocation(this.shader_program,"ka");
        this.u_constante_difusa = this.gl.getUniformLocation(this.shader_program,"kd");
        this.u_constante_especular = this.gl.getUniformLocation(this.shader_program,"ks");
        this.u_brillo = this.gl.getUniformLocation(this.shader_program,"n");
        this.u_f0 = this.gl.getUniformLocation(this.shader_program,"f0");
        this.u_rugosidad = this.gl.getUniformLocation(this.shader_program,"alfa");

        this.u_intensidad_ambiente = this.gl.getUniformLocation(this.shader_program,'ambiente');

        this.u_tiene_sombra = this.gl.getUniformLocation(this.shader_program,"tiene_sombra");

        this.u_posicion0 = this.gl.getUniformLocation(this.shader_program, "posicion0");
        this.u_intensidad0 = this.gl.getUniformLocation(this.shader_program, "intensidad0");
        this.u_atenuacion0 = this.gl.getUniformLocation(this.shader_program, "atenuacion0");
        this.u_posicion1 = this.gl.getUniformLocation(this.shader_program, "posicion1");
        this.u_intensidad1 = this.gl.getUniformLocation(this.shader_program, "intensidad1");
        this.u_atenuacion1 = this.gl.getUniformLocation(this.shader_program, "atenuacion1");

        this.u_n = this.gl.getUniformLocation(this.shader_program,'n');
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
        this.gl.uniform3fv(this.u_constante_ambiente,material.ka); 
        this.gl.uniform3fv(this.u_constante_difusa,material.kd); 
        this.gl.uniform3fv(this.u_constante_especular,material.ks); 
        this.gl.uniform1f(this.u_brillo,material.n); 
        this.gl.uniform1f(this.u_f0,material.f0); 
        this.gl.uniform1f(this.u_rugosidad,material.alfa); 
    }

    vertex(){
        return `#version 300 es
        precision mediump float;
        precision mediump int;
        
        uniform mat4 viewMatrix;
        uniform mat4 projectionMatrix;
        uniform mat4 normalMatrix;
        uniform mat4 modelMatrix;
        uniform mat4 lightViewMatrix;
        uniform mat4 lightProjectionMatrix;
        uniform vec3 posicion0;
        uniform vec3 posicion1;
        
        uniform int tiene_sombra;
        
        in vec3 vertexNormal;
        in vec3 vertexPosition;

        out vec4 shadowCoor;
        out vec3 normal;
        out vec3 ojo;
        out vec3 luz0;
        out vec3 luz1;
        

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

            if ( tiene_sombra == 1 ) shadowCoor = tMat * lightProjectionMatrix * lightViewMatrix * modelMatrix * vec4(vertexPosition, 1.0);
            else shadowCoor = vec4(0,0,0,0);
            gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(vertexPosition, 1);
        }
        `;
    }

    fragment(){
        return  `#version 300 es
        precision mediump float;
        precision mediump int;
        precision mediump sampler2DShadow;
        
        uniform vec3 ambiente;
        
        uniform vec3 ka;
        uniform vec3 kd;
        uniform vec3 ks;
        uniform float alfa;
        uniform float f0;
        
        uniform vec3 atenuacion0;
        uniform vec3 intensidad0;
        uniform vec3 atenuacion1;
        uniform vec3 intensidad1;

        uniform int tiene_sombra;
                
        uniform sampler2DShadow shadowMap;
        
        in vec4 shadowCoor;
        in vec3 luz0;
        in vec3 luz1;
        in vec3 ojo;
        in vec3 normal;
        out vec4 fragmentColor;
        
        float D(float NH) {
            float tan2b = ( 1.0 - (NH*NH) ) / ( NH*NH );
            float exponente = -tan2b/(alfa*alfa);
            float divisor = alfa * alfa * pow(NH,4.0); 			
            return exp(exponente)/divisor;
        }
        
        float G(float NH, float NV, float VH, float NL) { return min(1.0, min(2.0*NH*NV/VH, 2.0*NH*NL/VH)); }
        
        float F(float VH) { return f0 + (1.0-f0) * pow(1.0-VH,5.0); }
        
        float cook(float NH, float NV, float VH, float NL) { return F(VH)*G(NH,NV,VH,NL)*D(NH)/(3.14159*NV*NL); }
        
        vec3 calcular_termino_difuso_especular(vec3 luz, vec3 atenuacion, vec3 intensidad, vec3 V, vec3 N, float NV) {
            vec3 L = normalize(luz);
            vec3 H = normalize(L+V);
            float NH = max(dot(N,H), 0.0001);
            float VH = max(dot(V,H), 0.0001);
            float NL = max(dot(N,L), 0.0001);

            float d = length(luz);
            float fatt = 1.0/(1.0+atenuacion.x+atenuacion.y*d+atenuacion.z*d*d);

            return intensidad*fatt*(NL*kd + ks*cook(NH,NV,VH,NL));
        }
        void main() {
            float FP = 1.0/2.0;
        
            vec3 N = normalize(normal);
            vec3 V = normalize(ojo);
            float NV = max(dot(N,V), 0.0001);
            vec3 difuso_especular = vec3(0,0,0);
    
            difuso_especular += calcular_termino_difuso_especular(luz0, atenuacion0, intensidad0, V, N, NV);
            difuso_especular += calcular_termino_difuso_especular(luz1, atenuacion1, intensidad1, V, N, NV);

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

            vec3 iluminacion = ambiente*ka + visibility * difuso_especular;
        
            fragmentColor = vec4(iluminacion,1);
        }
        ` ;
    }
}