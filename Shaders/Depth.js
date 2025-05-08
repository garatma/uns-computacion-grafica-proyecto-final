class Depth {

    constructor(gl) {
        this.gl = gl;
        this.shader_program = ShaderProgramHelper.create(this.vertex(), this.fragment());

        this.u_matriz_modelo = this.gl.getUniformLocation(this.shader_program, 'modelMatrix');
        this.u_matriz_luz_vista = this.gl.getUniformLocation(this.shader_program, 'lightViewMatrix');
        this.u_matriz_luz_proyeccion = this.gl.getUniformLocation(this.shader_program, 'lightProjectionMatrix');

        this.loc_posicion = this.gl.getAttribLocation(this.shader_program, 'vertexPosition');
    }

    vertex() {
        return `#version 300 es


        uniform mat4 modelMatrix;
        uniform mat4 lightViewMatrix;
        uniform mat4 lightProjectionMatrix;


        in vec3 vertexPosition;


        void main() {

        	gl_Position = lightProjectionMatrix  * lightViewMatrix * modelMatrix * vec4(vertexPosition, 1.0);

        }
`;
    }

    fragment() {
        return `#version 300 es
precision highp float;

//out vec4 fragColor;
void main() {
	//fragColor = vec4(gl_FragCoord.z, 0, 0,1);


}`;
    }

}
