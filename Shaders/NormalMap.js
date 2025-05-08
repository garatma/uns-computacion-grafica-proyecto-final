class NormalMap {

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

        this.u_intensidad_ambiente = this.gl.getUniformLocation(this.shader_program,"intensidad_ambiente");

        this.u_brillo = this.gl.getUniformLocation(this.shader_program,"n");

        this.u_tiene_sombra = this.gl.getUniformLocation(this.shader_program,"tiene_sombra");

        this.u_posicion0 = this.gl.getUniformLocation(this.shader_program, "posicion0");
        this.u_intensidad0 = this.gl.getUniformLocation(this.shader_program, "intensidad0");
        this.u_atenuacion0 = this.gl.getUniformLocation(this.shader_program, "atenuacion0");
        this.u_posicion1 = this.gl.getUniformLocation(this.shader_program, "posicion1");
        this.u_intensidad1 = this.gl.getUniformLocation(this.shader_program, "intensidad1");
        this.u_atenuacion1 = this.gl.getUniformLocation(this.shader_program, "atenuacion1");

        this.u_tex0 = this.gl.getUniformLocation(this.shader_program,"tex0");
        this.u_tex1 = this.gl.getUniformLocation(this.shader_program,"tex1");
        this.u_tex2 = this.gl.getUniformLocation(this.shader_program,"tex2");

        this.u_texturas_seleccionadas = this.gl.getUniformLocation(this.shader_program,"tex_selec");
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

    set_material(n) { this.gl.uniform1f(this.u_brillo,n); }


    set_texturas(texturas) {
        this.gl.activeTexture(this.gl.TEXTURE1);
        this.gl.bindTexture(this.gl.TEXTURE_2D, texturas[0]);
        this.gl.uniform1i(this.u_tex0, 1); //nivel 0 para sombras.
        this.gl.activeTexture(this.gl.TEXTURE2);
        this.gl.bindTexture(this.gl.TEXTURE_2D, texturas[1]);
        this.gl.uniform1i(this.u_tex1, 2);
        this.gl.activeTexture(this.gl.TEXTURE3);
        this.gl.bindTexture(this.gl.TEXTURE_2D, texturas[2]);
        this.gl.uniform1i(this.u_tex2, 3);
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
        
        in vec3 vertexNormal;
        in vec3 vertexPosition;
        in vec2 vertexTextureCoordinates;
        
        out vec3 normal;
        out vec3 ojo;
        out vec3 luz0;
        out vec3 luz1;
        out vec2 ftextCoord;
        out mat3 TBNMatrix;
        out vec4 shadowCoor;
        out vec2 coordenadaTextura;

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
            ftextCoord = vertexTextureCoordinates;
            vec3 tangent = normalize(vec3(normalMatrix*vec4(0,1,0,0)));
            vec3 bitangent = normalize(cross(normal,tangent));
            TBNMatrix = mat3(tangent,bitangent,normal);
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
        
        uniform vec3 intensidad_ambiente;
        uniform float n;
        
        uniform int tiene_sombra;

        uniform vec3 atenuacion0;
        uniform vec3 intensidad0;
        uniform vec3 atenuacion1;
        uniform vec3 intensidad1;
                
        uniform sampler2D tex0;
        uniform sampler2D tex1;
        uniform sampler2D tex2;
        uniform vec3 tex_selec;
        
        uniform sampler2DShadow shadowMap;
        uniform sampler2D imagen;

        in vec4 shadowCoor;
        in vec2 ftextCoord;
        in vec3 normal;
        in vec3 ojo;
        in mat3 TBNMatrix;
        in vec3 luz0;
        in vec3 luz1;
        out vec4 fragmentColor;
        
        vec3 calcular_termino_difuso_especular(vec3 luz, vec3 atenuacion, vec3 intensidad, vec3 V, vec3 N, vec3 tex_difusa, vec3 tex_espec) {
            vec3 L = normalize(luz);
            vec3 H = normalize(L+V);
            float NHn = pow(max(dot(N,H), 0.0), n);
            float NL = max(dot(N,L), 0.0);
            vec3 especular = vec3(0,0,0);
            if(dot(N,L)>0.0) especular = tex_espec*NHn;

            float d = length(luz);
            float fatt = 1.0/(1.0+atenuacion.x+atenuacion.y*d+atenuacion.z*d*d);

            return intensidad*fatt*(NL*tex_difusa + especular);
        }
        
        void main() {
            float FP = 1.0/2.0;
        
            vec3 tex_base;
            if(tex_selec.x>0.0)  tex_base = vec3(texture(tex0, ftextCoord));
            else tex_base = vec3(1,1,1);
        
            vec3 tex_difusa = tex_base;
        
            vec3 tex_espec;
            if(tex_selec.z>0.0)  tex_espec = vec3(texture(tex2, ftextCoord));
            else tex_espec= vec3(1,1,1);
        
            vec3 N;
            vec3 normaltex = vec3(texture(tex1, ftextCoord));
            if(tex_selec.y>0.0) N = TBNMatrix * (normaltex * 2.0 - 1.0);
            else N = normalize(normal);
        
            vec3 V = normalize(ojo);
            vec3 difuso_especular = vec3(0,0,0);
            difuso_especular += calcular_termino_difuso_especular(luz0, atenuacion0, intensidad0, V, N, tex_difusa, tex_espec);
            difuso_especular += calcular_termino_difuso_especular(luz1, atenuacion1, intensidad1, V, N, tex_difusa, tex_espec);
           
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


            vec3 iluminacion = intensidad_ambiente*tex_difusa*0.1 + visibility * difuso_especular;
        
            fragmentColor = vec4(iluminacion,1);
        }`;
    }

}