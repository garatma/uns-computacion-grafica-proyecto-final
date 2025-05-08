class ShaderCielo {

    constructor(gl) {
        this.gl = gl;
        this.shader_program = ShaderProgramHelper.create(this.vertex(), this.fragment());

        this.u_matriz_vista = this.gl.getUniformLocation(this.shader_program, 'viewMatrix');
        this.u_matriz_proyeccion = this.gl.getUniformLocation(this.shader_program, 'projectionMatrix');
        this.u_matriz_modelo = this.gl.getUniformLocation(this.shader_program, 'modelMatrix');

        this.loc_posicion = this.gl.getAttribLocation(this.shader_program, 'vertexPosition');
        this.loc_textura = this.gl.getAttribLocation(this.shader_program, 'vertexTextureCoordinates');

        this.u_imagen = this.gl.getUniformLocation(this.shader_program, 'imagen');

        this.u_atenuacion = this.gl.getUniformLocation(this.shader_program,'atenuacion');
    }

    vertex(){

        return `#version 300 es

        uniform mat4 viewMatrix;
        uniform mat4 projectionMatrix;
        uniform mat4 modelMatrix;
        
        in vec2 vertexTextureCoordinates;
        in vec3 vertexPosition;
        out vec2 coordenadaTextura;
        
        void main() {
            coordenadaTextura = vertexTextureCoordinates;
            gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(vertexPosition, 1);
        }
        `;
    }

    fragment(){
        return  `#version 300 es
        precision mediump float;
        
        uniform float atenuacion;
        uniform sampler2D imagen;

        in vec2 coordenadaTextura;
        out vec4 fragmentColor;

        void main() {
            vec3 textura = vec3(texture(imagen, coordenadaTextura));
            fragmentColor = vec4(textura*atenuacion,1);
        }
        ` ;
    }
}
