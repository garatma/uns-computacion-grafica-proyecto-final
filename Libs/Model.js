class Model {
	constructor(objectSource, material, loc_posicion, loc_normal, loc_textura) {
		this.parsedOBJ = OBJParser.parseFile(objectSource);
		this.indices = this.parsedOBJ.indices;
		this.cant_indices = this.indices.length;
		this.positions = this.parsedOBJ.positions;
		this.normals = this.parsedOBJ.normals;
		this.textures = this.parsedOBJ.textures;
		this.material = material;
		this.matriz = mat4.create();
		this.texturas = [];
		this.niveles = 0;

		let vertexAttributeInfoArray = null;
		vertexAttributeInfoArray = [ new VertexAttributeInfo(this.positions, loc_posicion, 3) ];
		if ( loc_normal != null ) vertexAttributeInfoArray.push(new VertexAttributeInfo(this.normals, loc_normal, 3));
		if ( loc_textura != null ) vertexAttributeInfoArray.push(new VertexAttributeInfo(this.textures, loc_textura, 2));

		this.vao = VAOHelper.create(this.indices, vertexAttributeInfoArray);
	}
}