var gl, canvas;

// Shaders
var phong, phong_madera, normal_map, cook_torrance, shader_cielo, depth;

// Texturas
var texturas_seleccionadas = [1.0,1.0,1.0];
var texturas_difusas = new Array(5);
var texturas_normales = new Array(5);
var textura_especular;
var texturas_difusas_lienzo = new Array(3);
var texturas_normal_lienzo = new Array(3);
var texturas_especular_lienzo = new Array(3);
var textura_lienzo_seleccionado = 1;
var depthTexture;

// Misc
var angulo_viejo_hora = 0, angulo_viejo_minutos = 0, angulo_viejo_segundos = 0;
var camara, luzCamara, cameraLViewMatrix, picking;
var fullscreen=false;
var lastDrawTimePicking;
var rotationSpeedPicking = 30;
var pickedObject = null ; //Objeto actualmente seleccionado
var ocultar=false;
var mostrar_interfaz=false;

// Atril
var pluma, plumaS;
var contenedor;
var tintero;
var atril, atrilS;
var lomo, cuerpo_fondo, cuerpo_frente, pagina_frente, pagina_fondo, pagina_medio;
var calavera, calaveraS;
var vela, velaS, vela_base, llama;

// Mesa y libros
var mesa, mesaS;
var libro_base, libro_resto, libro_restoS;

// Estufa
var estufa_clara, estufa_claraS;
var estufa_oscura, estufa_oscuraS;
var estufa_interior;
var estufa_patas, estufa_patasS;

// Paredes y suelo
var pared_izquierda;
var pared_fondo;
var marco_ventana, pared_ventana;
var pared;
var cielorraso;
var puerta;

// Suelo
var alfombra, suelo, banqueta, banquetaS;

// Exterior
var cielo;
var luna;

// En pared izquierda
var marco, lienzo;
var farol;

// Reloj
var manecilla_minuto_hora, manecilla_segundo;
var reloj_blanco, reloj_numeros_negros, reloj_oro;
var reloj_pendulo_blanco, reloj_pendulo_blancoS;
var reloj_pendulo_oro, reloj_pendulo_oroS;
var reloj_placa_pendulo;
var reloj_madera, reloj_maderaS;

var arregloObjS;

// Variables animación del reloj
var angulo_viejo_hora = 0, angulo_viejo_minutos = 0, angulo_viejo_segundos = 0;
var segundo_viejo;
var hora_vieja;
var cant_toques_campana = 0;
var escala_vela = vec3.create();
// var vector_traslacion_reloj = [-3.37,12,9];
var vector_traslacion_reloj = [-9,12,6.4];
var vela_apagada = false;
var rnd = 0;

// Sonidos del reloj
var high_tick;
var low_tick;
var bell;

// Variables animación del péndulo
var rotationSpeed = 10;
var lastDrawTime = 0 // tiempo en el que se dibujo el ultimo frame
var cuenta = 0
var signo = -1;
var it = 0;

var angulo = Math.PI/50;
var v=0;
var cambio_segundo = 0;
let scaling = vec3.create();

// Variables Auxiliares para los objetos de luz
var luz_vela, luz_farol, luces = [];
var luz_seleccionada = 0;

function onLoad() {
	canvas = document.getElementById('webglCanvas');
	gl = canvas.getContext('webgl2');

	gl.clearColor(0,0,0,1);
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
	gl.enable(gl.CULL_FACE);
	
	camara = new Camara(canvas);
	camara.forwards_backwards(-5-2+5.7);
	camara.left_right(-19+2.6+3);
	camara.yaw(40*Math.PI/180);
	camara.pitch(-20*Math.PI/180);

	inicializar_luces();

	let pos = Utils.cartesianas_a_esfericas(luz_farol.posicion);
	const fovy = 40;
	const aspect = -1.1;
	const nearL = 1;
	const farL = -0.6;
	luzCamara = new CamaraSombras(canvas, pos[0], pos[1], pos[2], fovy, aspect, nearL, farL);
	cameraLViewMatrix = mat4.create();
	mat4.lookAt(cameraLViewMatrix, luz_farol.posicion, [-20,-23.7331,0], [0,0,1]);
	document.oncontextmenu = function() { return false; }

	picking = new Picking(canvas, camara);

	depthTexture = gl.createTexture();

	declarar_shaders();
	declarar_objetos();
	declarar_texturas();
	posicionar_objetos();
	bounding_box_objetos();
	actualizar_interfaz()

	gl.bindVertexArray(null);

	high_tick = document.getElementById("high_tick");
	low_tick = document.getElementById("low_tick");
	bell = document.getElementById("bell");

	segundo_viejo = new Date().getSeconds();
	hora_vieja = new Date().getHours()%12;
	
	lastDrawTime = 0;
	lastDrawTimePicking = 0;
	
	requestAnimationFrame(onRender)
}

function onRender(now) {
	now *= 0.001                       	
	const timeDelta = now - lastDrawTime
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	mover_pendulo(timeDelta);
	rotar_manecilla_segundo();
	rotar_manecilla_minuto();
	rotar_manecilla_hora();
	pick(now);
	if ( !vela_apagada ) 
	achicar_vela();
	activar_sombra();

	draw_with_Shader_CookTorrance();
	draw_with_Shader_Phong_ProceduralMadera();
	draw_with_Shader_Phong();
	draw_with_Shader_NormalMap();

	gl.activeTexture(gl.TEXTURE0);
	gl.useProgram(shader_cielo.shader_program);
	dibujar_cielo();
	gl.useProgram(null);

	lastDrawTime = now
	requestAnimationFrame(onRender);
}

function draw_with_Shader_CookTorrance(){
	gl.useProgram(cook_torrance.shader_program);

	dibujar(cook_torrance, estufa_oscura);

	gl.uniform1i(cook_torrance.u_tiene_sombra,0);

	if ( !vela_apagada ) {
		luz_vela.intensidad[0] += 10;
		luz_vela.intensidad[1] += 10;
		luz_vela.intensidad[2] += 10;
		dibujar(cook_torrance, llama);
		luz_vela.intensidad[0] -= 10;
		luz_vela.intensidad[1] -= 10;
		luz_vela.intensidad[2] -= 10;
	}
	dibujar(cook_torrance, vela);
	dibujar(cook_torrance, vela_base);
	dibujar(cook_torrance, tintero);
	
	dibujar(cook_torrance, estufa_clara);
	dibujar(cook_torrance, estufa_interior);

	dibujar(cook_torrance, marco);

	dibujar(cook_torrance, reloj_blanco);
	dibujar(cook_torrance, reloj_numeros_negros);
	dibujar(cook_torrance, reloj_oro);
	dibujar(cook_torrance, reloj_pendulo_oro);
	dibujar(cook_torrance, reloj_pendulo_blanco);
	dibujar(cook_torrance, manecilla_hora);
	dibujar(cook_torrance, manecilla_minuto);
	dibujar(cook_torrance, manecilla_segundo);
	gl.useProgram(null);
}

function draw_with_Shader_Phong_ProceduralMadera(){
	gl.useProgram(phong_madera.shader_program);
	dibujar(phong_madera, atril);

	dibujar(phong_madera, banqueta);

	dibujar(phong_madera, mesa);

	dibujar(phong_madera, reloj_madera);


	dibujar(phong_madera, estufa_patas);

	gl.uniform1i(phong_madera.u_tiene_sombra,0);
	dibujar(phong_madera,marco_ventana);

	gl.useProgram(null);
}

function draw_with_Shader_Phong(){
	gl.useProgram(phong.shader_program);

	gl.activeTexture(gl.TEXTURE1);

	dibujar(phong, alfombra);
	dibujar(phong, reloj_placa_pendulo);

	gl.uniform1i(phong.u_tiene_sombra,0);

	dibujar(phong, cuerpo_fondo);
	dibujar(phong, cuerpo_frente);
	dibujar(phong, lomo);
	dibujar(phong, pagina_frente);
	dibujar(phong, pagina_medio);
	dibujar(phong, pagina_fondo);

	dibujar(phong, pluma);

	mat4.translate(pluma.matriz, pluma.matriz, [-1,0,22]);
	mat4.rotateY(pluma.matriz, pluma.matriz,0.2);
	mat4.rotateZ(pluma.matriz, pluma.matriz,0.2);
	dibujar(phong, pluma);

	mat4.translate(pluma.matriz, pluma.matriz, [0.9,0,0]);
	mat4.rotateX(pluma.matriz, pluma.matriz,0.1);
	dibujar(phong, pluma);

	mat4.translate(pluma.matriz, pluma.matriz, [-0.9,0,0]);
	mat4.rotateX(pluma.matriz, pluma.matriz,-0.1);
	mat4.rotateZ(pluma.matriz, pluma.matriz,-0.2);
	mat4.rotateY(pluma.matriz, pluma.matriz,-0.2);
	mat4.translate(pluma.matriz, pluma.matriz, [1,0,-22]);

	let intensidad_aux_vela = luz_vela.intensidad;
	let intensidad_aux_farol = luz_farol.intensidad;
	luz_vela.intensidad = [0,0,0];
	luz_farol.intensidad = [2,2,2];
	let atenuacion_aux_vela = luz_vela.atenuacion;
	let atenuacion_aux_farol = luz_farol.atenuacion;
	luz_vela.atenuacion = [0,0,0];
	luz_farol.atenuacion = [0,0,0];
	dibujar(phong, luna);
	luz_vela.intensidad = intensidad_aux_vela;
	luz_farol.intensidad = intensidad_aux_farol;
	luz_vela.atenuacion = atenuacion_aux_vela;
	luz_farol.atenuacion = atenuacion_aux_farol;

	dibujar(phong, contenedor);

	dibujar(phong, cielorraso);

	dibujar(phong, calavera);

	gl.useProgram(null);
}

function draw_with_Shader_NormalMap(){
	gl.useProgram(normal_map.shader_program);

	gl.uniform3f(normal_map.u_texturas_seleccionadas,texturas_seleccionadas[0],texturas_seleccionadas[1],texturas_seleccionadas[2]);

	dibujar(normal_map, pared);
	dibujar(normal_map, pared_ventana);
	dibujar(normal_map, libro_base);
	dibujar(normal_map, suelo);


	gl.uniform1i(normal_map.u_tiene_sombra,0);

	dibujar(normal_map, puerta);

	for ( let i = 1; i < 6; i++ ) {
		mat4.translate(libro_resto.matriz, libro_resto.matriz, [0,-0.05,0]);
		mat4.rotateY(libro_resto.matriz, libro_resto.matriz, Math.cos(i));
		libro_resto.texturas.push(texturas_difusas[i]);
		libro_resto.texturas.push(texturas_normales[i]);
		libro_resto.texturas.push(textura_especular);
		dibujar(normal_map, libro_resto);
		libro_resto.texturas.pop();
		libro_resto.texturas.pop();
		libro_resto.texturas.pop();
		mat4.rotateY(libro_resto.matriz, libro_resto.matriz, -Math.cos(i));
	}
	mat4.translate(libro_resto.matriz, libro_resto.matriz, [0,0.05*5,0]);

	for ( let i = -3; i < 6; i++) {
		for ( let j = -3; j < 6; j++) {
			mat4.translate(suelo.matriz, suelo.matriz, [0,11.27*i,11.27*j]);
			if ( i != 0 || j != 0 ) dibujar(normal_map, suelo);
			mat4.translate(suelo.matriz, suelo.matriz, [0,-11.27*i,-11.27*j]);
		}
	}

	luz_farol.intensidad[0] += 5;
	luz_farol.intensidad[1] += 5;
	luz_farol.intensidad[2] += 10;
	dibujar(normal_map, farol);
	luz_farol.intensidad[0] -= 5;
	luz_farol.intensidad[1] -= 5;
	luz_farol.intensidad[2] -= 10;

	dibujar(normal_map, pared_izquierda);
	dibujar(normal_map, pared_fondo);
	
	draw_lienzo(textura_lienzo_seleccionado);

	gl.useProgram(null);

}

function draw_lienzo (valor){
	lienzo.texturas.push(texturas_difusas_lienzo[valor]);
	lienzo.texturas.push(texturas_normal_lienzo[valor]);
	lienzo.texturas.push(texturas_especular_lienzo[valor]);
	dibujar(normal_map, lienzo);
	lienzo.texturas.pop();
	lienzo.texturas.pop();
	lienzo.texturas.pop();
}

function dibujar_cielo() {
	gl.bindTexture(gl.TEXTURE_2D, cielo.texturas[0]);
	gl.uniform1i(shader_cielo.u_imagen, 0);

	gl.uniform1f(shader_cielo.u_atenuacion, 0.7);
	gl.uniformMatrix4fv(shader_cielo.u_matriz_vista, false, camara.vista());
	gl.uniformMatrix4fv(shader_cielo.u_matriz_proyeccion, false, camara.proyeccion());
	gl.uniformMatrix4fv(shader_cielo.u_matriz_modelo, false, cielo.matriz);

	gl.bindVertexArray(cielo.vao);
	gl.drawElements(gl.TRIANGLES, cielo.cant_indices, gl.UNSIGNED_INT, 0);
	gl.bindVertexArray(null);
}

function rotar_manecilla_hora() {
	let hora = new Date().getHours()%12;
	let angulo = 2*Math.PI;
	// para no dividir por cero, si la hora es 0, la manecilla se posiciona en las 12
	if ( hora != 0 ) angulo *= hora/12;

	// mejorar y hacerlo con loop y tiempo
	if ( hora != hora_vieja ) {
		if ( cant_toques_campana == 0 ) {
			bell.play();
			cant_toques_campana++;
		}
		if ( bell.ended ) {
			bell.play();
			cant_toques_campana++;
		}
		if ( cant_toques_campana == hora ) {
			hora_vieja = hora;
			cant_toques_campana = -1;
		}
	}

	mat4.translate(manecilla_hora.matriz,manecilla_hora.matriz,[0,1.1,0]);
	mat4.rotateZ(manecilla_hora.matriz, manecilla_hora.matriz, angulo_viejo_hora-angulo);
	angulo_viejo_hora = angulo;
	mat4.translate(manecilla_hora.matriz,manecilla_hora.matriz,[0,-1.1,0]);
}

function rotar_manecilla_minuto() {
	let minutos = new Date().getMinutes();
	let angulo = 2*Math.PI;
	// para no dividir por cero, si los minutos son 0, la manecilla se posiciona en las 12
	if ( minutos != 0 ) angulo *= minutos/60;

	mat4.translate(manecilla_minuto.matriz,manecilla_minuto.matriz,[0,1.3,0]);
	mat4.rotateZ(manecilla_minuto.matriz, manecilla_minuto.matriz, angulo_viejo_minutos-angulo);
	angulo_viejo_minutos = angulo;
	mat4.translate(manecilla_minuto.matriz,manecilla_minuto.matriz,[0,-1.3,0]);
}

function rotar_manecilla_segundo() {
	let segundos = new Date().getSeconds();
	let angulo = 2*Math.PI;
	cambio_segundo = 0;
	if ( segundos != segundo_viejo ) {
		cambio_segundo = 1;
		if ( segundos % 2 == 0 ) high_tick.play();
		else low_tick.play();
		segundo_viejo = segundos;
	}
	// para no dividir por cero, si los segundos son 0, la manecilla se posiciona en las 12
	if ( segundos != 0 ) angulo *= segundos/60;
	mat4.translate(manecilla_segundo.matriz,manecilla_segundo.matriz,[0,-2,0]);
	mat4.rotateZ(manecilla_segundo.matriz, manecilla_segundo.matriz, angulo_viejo_segundos-angulo);
	angulo_viejo_segundos = angulo;
	mat4.translate(manecilla_segundo.matriz,manecilla_segundo.matriz,[0,2,0]);
}

function mover_pendulo(timeDelta){
	const rotationAngle = timeDelta * rotationSpeed
	cuenta += rotationAngle
	if ( cuenta > rotationSpeed ) {
		signo = -signo;
		cuenta = 0
	}
	if ( it == 0 ) it = 1;
	else {
		let a = -9.8 * Math.sin(rotationAngle)/0.99;
		v += a;
		let angulo = Math.PI/60*Math.sin(Math.sqrt(9.81/0.99)*v*0.01);
		let matriz = mat4.create();
		mat4.translate(matriz, matriz, vector_traslacion_reloj);
		mat4.rotateY(matriz, matriz, Math.PI/2);
		mat4.scale(matriz,matriz,[0.2,0.2,0.2]);
		mat4.rotateZ(matriz,matriz,angulo);
		reloj_pendulo_blanco.matriz = matriz;
		reloj_pendulo_oro.matriz = matriz;
		reloj_pendulo_blancoS.matriz = matriz;
		reloj_pendulo_oroS.matriz = matriz;
	}
}

function achicar_vela() {
	mat4.getScaling(scaling,vela.matriz);
	let razon = scaling[1]/escala_vela;
	luz_vela.atenuacion[0] -= rnd;
	rnd = Math.pow(-1,Utils.random(0,1))*Utils.random(0,2)/10
	luz_vela.atenuacion[0] = 0;
	if ( scaling[1] > 0.3 ) {
		mat4.scale(vela.matriz,vela.matriz,[1,0.9999,1]);
		velaS.matriz = vela.matriz;
		if ( scaling[1] > 0.4 ) {
			mat4.translate(llama.matriz,llama.matriz,[0,-0.00028,0]);
			luz_vela.posicion[1] -= 0.00028*0.4;
		}
		else {
			mat4.translate(llama.matriz,llama.matriz,[0,-0.0001,0]);
			luz_vela.posicion[1] -= 0.0001*0.4;
		}
		luz_vela.atenuacion[0] += 1-razon+rnd;
	}
	else {
		luz_vela.atenuacion = [100,100,100];
		vela_apagada = true;
		document.getElementById("boton_vela").style.setProperty('background-color', 'green');
		document.getElementById("boton_vela").hidden = false;
	}
}

function dibujar(shader, objeto) {
	shader.set_luz(luz_ambiente, luces);
	shader.set_material(objeto.material);
	if ( objeto.niveles ) shader.set_texturas(objeto.texturas);

	// setea uniforms de matrices de modelo y normales
	let matriz_normal = mat4.create()
	gl.uniformMatrix4fv(shader.u_matriz_vista, false, camara.vista());
	gl.uniformMatrix4fv(shader.u_matriz_proyeccion, false, camara.proyeccion());
	mat4.multiply(matriz_normal,camara.vista(),objeto.matriz);
	mat4.invert(matriz_normal,matriz_normal);
	mat4.transpose(matriz_normal,matriz_normal);
	gl.uniformMatrix4fv(shader.u_matriz_normal, false, matriz_normal);
	gl.uniformMatrix4fv(shader.u_matriz_modelo, false, objeto.matriz);

	gl.bindVertexArray(objeto.vao);
	gl.drawElements(gl.TRIANGLES, objeto.cant_indices, gl.UNSIGNED_INT, 0);
	gl.bindVertexArray(null);
}

function declarar_shaders() {
	phong = new Phong(gl);
	normal_map = new NormalMap(gl);
	phong_madera = new PhongMadera(gl);
	cook_torrance = new CookTorrance(gl);
	shader_cielo = new ShaderCielo(gl);
	depth = new Depth(gl);
}

function declarar_objetos() {
	pluma = new Model(pluma_obj,10,phong.loc_posicion,phong.loc_normal,phong.loc_textura);
	plumaS = new Model(pluma_obj,null,depth.loc_posicion,null,null);

	contenedor = new Model(contenedor_obj,10,phong.loc_posicion,phong.loc_normal,phong.loc_textura);
	
	atril = new Model(atril_obj,material_atril,phong_madera.loc_posicion,phong_madera.loc_normal,phong_madera.loc_textura);
	atrilS = new Model(atril_obj,null,depth.loc_posicion,null,null);

	mesa = new Model(mesa_obj,material_atril,phong_madera.loc_posicion,phong_madera.loc_normal,phong_madera.loc_textura);
	mesaS = new Model (mesa_obj,null,depth.loc_posicion,null,null);

	marco_ventana = new Model(marco_ventana_obj,material_atril,phong_madera.loc_posicion,phong_madera.loc_normal,phong_madera.loc_textura);
	pared = new Model(pared_obj,10,normal_map.loc_posicion,normal_map.loc_normal,normal_map.loc_textura);
	pared_fondo = new Model(pared_fondo_obj,10,normal_map.loc_posicion,normal_map.loc_normal,normal_map.loc_textura);
	puerta = new Model(puerta_obj,10,normal_map.loc_posicion,normal_map.loc_normal,normal_map.loc_textura);
	cielorraso = new Model(cielorraso_obj,70,phong.loc_posicion,phong.loc_normal,phong.loc_textura);
	pared_izquierda = new Model(pared_obj,10,normal_map.loc_posicion,normal_map.loc_normal,normal_map.loc_textura);
	suelo = new Model(suelo_obj,10,normal_map.loc_posicion,normal_map.loc_normal,normal_map.loc_textura);
	pared_ventana = new Model(pared_ventana_obj,10,normal_map.loc_posicion,normal_map.loc_normal,normal_map.loc_textura);
	tintero = new Model(tintero_obj,material_tintero,cook_torrance.loc_posicion,cook_torrance.loc_normal,null);

	vela = new Model(vela_obj,material_vela,cook_torrance.loc_posicion,cook_torrance.loc_normal,null);
	velaS = new Model(vela_obj,null,depth.loc_posicion,null,null);

	vela_base = new Model(vela_base_obj,material_oro,cook_torrance.loc_posicion,cook_torrance.loc_normal,null);

	llama = new Model(llama_obj,material_llama,cook_torrance.loc_posicion,cook_torrance.loc_normal,null);

	calavera = new Model (calavera_obj,10,phong.loc_posicion,phong.loc_normal,phong.loc_textura);
	calaveraS = new Model(calavera_obj,10,depth.loc_posicion,null,null);

	libro_base = new Model(libro_base_obj,10,normal_map.loc_posicion,normal_map.loc_normal,normal_map.loc_textura);

	libro_resto = new Model(libro_resto_obj,10,normal_map.loc_posicion,normal_map.loc_normal,normal_map.loc_textura);
	libro_restoS = new Model(libro_resto_obj,null,depth.loc_posicion,null,null);

	lomo = new Model(lomo_obj,10,phong.loc_posicion,phong.loc_normal,phong.loc_textura);
	cuerpo_fondo = new Model(cuerpo_fondo_obj,10,phong.loc_posicion,phong.loc_normal,phong.loc_textura);
	cuerpo_frente = new Model(cuerpo_frente_obj,10,phong.loc_posicion,phong.loc_normal,phong.loc_textura);
	pagina_frente = new Model(pagina_frente_obj,10,phong.loc_posicion,phong.loc_normal,phong.loc_textura);
	pagina_fondo = new Model(pagina_fondo_obj,10,phong.loc_posicion,phong.loc_normal,phong.loc_textura);
	pagina_medio = new Model(pagina_medio_obj,10,phong.loc_posicion,phong.loc_normal,phong.loc_textura);

	manecilla_hora = new Model(manecilla_minuto_hora_obj,material_negro,cook_torrance.loc_posicion,cook_torrance.loc_normal,null);
	manecilla_minuto = new Model(manecilla_minuto_hora_obj,material_negro,cook_torrance.loc_posicion,cook_torrance.loc_normal,null);
	manecilla_segundo = new Model(manecilla_segundo_obj,material_negro,cook_torrance.loc_posicion,cook_torrance.loc_normal,null);

	reloj_blanco = new Model(reloj_blanco_obj,material_blanco,cook_torrance.loc_posicion,cook_torrance.loc_normal,null);
	reloj_numeros_negros = new Model(reloj_numeros_negros_obj,material_negro,cook_torrance.loc_posicion,cook_torrance.loc_normal,null);
	reloj_oro = new Model(reloj_oro_obj,material_oro,cook_torrance.loc_posicion,cook_torrance.loc_normal,null);

	reloj_madera = new Model(reloj_madera_obj,material_atril,phong_madera.loc_posicion,phong_madera.loc_normal,phong_madera.loc_textura);
	reloj_maderaS = new Model(reloj_madera_obj,null,depth.loc_posicion,null,null);

	reloj_pendulo_blanco = new Model(reloj_pendulo_blanco_obj,material_blanco,cook_torrance.loc_posicion,cook_torrance.loc_normal,null);
	reloj_pendulo_blancoS = new Model(reloj_pendulo_blanco_obj,null,depth.loc_posicion,null,null);

	reloj_pendulo_oro = new Model(reloj_pendulo_oro_obj,material_oro,cook_torrance.loc_posicion,cook_torrance.loc_normal,null);
	reloj_pendulo_oroS = new Model(reloj_pendulo_oro_obj,null,depth.loc_posicion,null,null);
	
	reloj_placa_pendulo = new Model(reloj_placa_pendulo_obj,10,phong.loc_posicion,phong.loc_normal,phong.loc_textura);

	banqueta = new Model(banqueta_obj,material_banqueta,phong_madera.loc_posicion,phong_madera.loc_normal,phong_madera.loc_textura);
	banquetaS = new Model(banqueta_obj,null,depth.loc_posicion,null,null);

	farol = new Model(farol_obj,10,normal_map.loc_posicion,normal_map.loc_normal,normal_map.loc_textura);

	alfombra = new Model(alfombra_obj,10,phong.loc_posicion,phong.loc_normal,phong.loc_textura);
	
	marco = new Model(marco_obj,material_oro,cook_torrance.loc_posicion,cook_torrance.loc_normal,null);
	lienzo = new Model(lienzo_obj,100,normal_map.loc_posicion,normal_map.loc_normal,normal_map.loc_textura);
	
	estufa_clara = new Model(estufa_clara_obj,material_negro_claro,cook_torrance.loc_posicion,cook_torrance.loc_normal,null);
	estufa_claraS = new Model(estufa_clara_obj,null,depth.loc_posicion,null,null);

	estufa_oscura = new Model(estufa_oscura_obj,material_negro_estufa,cook_torrance.loc_posicion,cook_torrance.loc_normal,null);
	estufa_oscuraS = new Model(estufa_oscura_obj,null,depth.loc_posicion,null,null);

	estufa_interior = new Model(estufa_interior_obj,material_interior_estufa,cook_torrance.loc_posicion,cook_torrance.loc_normal,null);

	estufa_patas = new Model(estufa_patas_obj,material_atril,phong_madera.loc_posicion,phong_madera.loc_normal,phong_madera.loc_textura);
	estufa_patasS = new Model(estufa_patas_obj,null,depth.loc_posicion,null,null);

	cielo = new Model(cielo_obj, 10,shader_cielo.loc_posicion,shader_cielo.loc_normal,shader_cielo.loc_textura); 

	luna = new Model(luna_obj, 10, phong.loc_posicion, phong.loc_normal, phong.loc_textura);

	arregloObjS = [plumaS, atrilS, calaveraS, velaS, mesaS, libro_restoS, estufa_claraS, estufa_oscuraS, estufa_patasS, banquetaS, reloj_maderaS, reloj_pendulo_blancoS, reloj_pendulo_oroS];
}

function declarar_texturas() {
	let textura;

	// pila de libros (resto)
	libro_resto.niveles++;
	for ( let i = 1; i < 6; i++ ) {
		texturas_difusas[i] = inicializar_textura("../Modelos/pila libros/textura_difusa_"+i+".png",1);
		texturas_normales[i] = inicializar_textura("../Modelos/pila libros/textura_normal_"+i+".png",2);
	}
	textura_especular = inicializar_textura("../Modelos/pila libros/textura_oclusion_ambiente.png",3);
	libro_resto.niveles = 4;
	
	// pila de libros (base)
	libro_base.niveles++; //nivel 0 para sombras.
	textura = inicializar_textura("../Modelos/pila libros/textura_difusa_base.png",libro_base.niveles++);
	libro_base.texturas.push(textura);
	textura = inicializar_textura("../Modelos/pila libros/textura_normal_base.png",libro_base.niveles++);
	libro_base.texturas.push(textura);
	textura = inicializar_textura("../Modelos/pila libros/textura_especular_base.png",libro_base.niveles++);
	libro_base.texturas.push(textura);

	// pluma y contenedor
	pluma.niveles++; 
	textura = inicializar_textura("../Modelos/pluma/textura_pluma.jpg",pluma.niveles++);
	pluma.texturas.push(textura);

	contenedor.niveles++;
	textura = inicializar_textura("../Modelos/pluma/textura_contenedor.jpg",contenedor.niveles++);
	contenedor.texturas.push(textura);

	// paredes
	pared.niveles++;
	textura = inicializar_textura("../Modelos/pared/textura_difusa.jpg",pared.niveles++);
	pared.texturas.push(textura);
	pared_izquierda.texturas.push(textura);
	pared_ventana.texturas.push(textura);
	pared_fondo.texturas.push(textura);
	textura = inicializar_textura("../Modelos/pared/textura_normal.jpg",pared.niveles++);
	pared.texturas.push(textura);
	pared_izquierda.texturas.push(textura);
	pared_ventana.texturas.push(textura);
	pared_fondo.texturas.push(textura);
	textura = inicializar_textura("../Modelos/pared/textura_oclusion_ambiente.jpg",pared.niveles++);
	pared.texturas.push(textura);
	pared_izquierda.texturas.push(textura);
	pared_fondo.texturas.push(textura);
	pared_ventana.texturas.push(textura);
	pared_fondo.texturas.push(textura);
	pared_izquierda.niveles = 4;
	pared_ventana.niveles = 4;
	pared_fondo.niveles = 4;

	// puerta
	puerta.niveles++;
	textura = inicializar_textura("../Modelos/puerta/textura_difusa.png",puerta.niveles++);
	puerta.texturas.push(textura);
	textura = inicializar_textura("../Modelos/puerta/textura_normal.png",puerta.niveles++);
	puerta.texturas.push(textura);
	textura = inicializar_textura("../Modelos/puerta/textura_oclusion_ambiente.png",puerta.niveles++);
	puerta.texturas.push(textura);

	// cielorraso
	cielorraso.niveles++;
	textura = inicializar_textura("../Modelos/cielorraso/textura_cielorraso.png",cielorraso.niveles++);
	cielorraso.texturas.push(textura);

	// calavera
	calavera.niveles++;
	textura = inicializar_textura("../Modelos/calavera/textura.png",calavera.niveles++);
	calavera.texturas.push(textura);

	// suelo
	suelo.niveles++;
	textura = inicializar_textura("../Modelos/suelo/textura_difusa.jpg",suelo.niveles++);
	suelo.texturas.push(textura);
	textura = inicializar_textura("../Modelos/suelo/textura_normal.png",suelo.niveles++);
	suelo.texturas.push(textura);
	textura = inicializar_textura("../Modelos/suelo/textura_oclusion_ambiente.png",suelo.niveles++);
	suelo.texturas.push(textura);

	// libro del atril
	cuerpo_fondo.niveles++;
	textura = inicializar_textura("../Modelos/libro/textura_cuerpo_fondo.jpg",cuerpo_fondo.niveles++);
	cuerpo_fondo.texturas.push(textura);

	cuerpo_frente.niveles++;
	textura = inicializar_textura("../Modelos/libro/textura_cuerpo_frente.jpg",cuerpo_frente.niveles++);
	cuerpo_frente.texturas.push(textura);

	lomo.niveles++;
	textura = inicializar_textura("../Modelos/libro/textura_lomo.png",lomo.niveles++);
	lomo.texturas.push(textura);

	pagina_frente.niveles++;
	textura = inicializar_textura("../Modelos/libro/textura_pagina_frente.jpg",pagina_frente.niveles++);
	pagina_frente.texturas.push(textura);

	pagina_fondo.niveles++;
	textura = inicializar_textura("../Modelos/libro/textura_pagina_medio_fondo.jpg",pagina_fondo.niveles++);
	pagina_fondo.texturas.push(textura);
	
	// placa del péndulo
	reloj_placa_pendulo.niveles++;
	textura = inicializar_textura("../Modelos/reloj/textura_placa_pendulo.png",reloj_placa_pendulo.niveles++);
	reloj_placa_pendulo.texturas.push(textura);

	// farol
	farol.niveles++;
	textura = inicializar_textura("../Modelos/farol/textura_difusa.png",farol.niveles++);
	farol.texturas.push(textura);
	textura = inicializar_textura("../Modelos/farol/textura_normal.png",farol.niveles++);
	farol.texturas.push(textura);
	textura = inicializar_textura("../Modelos/farol/textura_especular.png",farol.niveles++);
	farol.texturas.push(textura);

	//lienzo
	lienzo.niveles++;
	for ( let i = 1; i < 4; i++ ) {
		texturas_difusas_lienzo[i] = inicializar_textura("../Modelos/cuadro/textura_difusa_"+i+".png",lienzo.niveles++);
		texturas_normal_lienzo[i] = inicializar_textura("../Modelos/cuadro/textura_normal_"+i+".png",lienzo.niveles++);
		texturas_especular_lienzo[i] = inicializar_textura("../Modelos/cuadro/textura_especular_"+i+".png",lienzo.niveles++);
	}

	// alfombra
	alfombra.niveles++;
	textura = inicializar_textura("../Modelos/alfombra/textura.jpg",alfombra.niveles++);
	alfombra.texturas.push(textura);

	// cielo
	textura = inicializar_textura("../Modelos/cielo/textura.jpg",cielo.niveles++);
	cielo.texturas.push(textura);

	// luna
	luna.niveles++;
	textura = inicializar_textura("../Modelos/luna/textura.png",luna.niveles++);
	luna.texturas.push(textura);
}

function posicionar_objetos() {
	// // VELA, BASE y LLAMA
	mat4.translate(vela_base.matriz, vela_base.matriz, [-10.7,6.7,-6]);
	mat4.scale(vela_base.matriz, vela_base.matriz, [0.1,0.1,0.1]);

	mat4.translate(vela.matriz, vela.matriz, [-10.7,6.7,-6]);
	mat4.scale(vela.matriz, vela.matriz, [0.3,1,0.3]);
	velaS.matriz = vela.matriz;

	mat4.getScaling(escala_vela, vela.matriz);
	escala_vela = escala_vela[1];

	mat4.translate(llama.matriz, llama.matriz, [-10.69,7.6,-6.01]);
	mat4.scale(llama.matriz, llama.matriz, [0.4,0.5,0.4]);
	
	// // FAROL
	mat4.translate(farol.matriz, farol.matriz,[7.3,10,9.7] );
	mat4.rotateY(farol.matriz, farol.matriz, Math.PI);
	mat4.scale(farol.matriz,farol.matriz,[10,10,10]);

	// //PLUMA
	mat4.translate(pluma.matriz, pluma.matriz, [-10.6,7.8,-1.5]);
	mat4.scale(pluma.matriz, pluma.matriz, [0.1,0.1,0.1]);
	mat4.rotateY(pluma.matriz, pluma.matriz, Math.PI);
	plumaS.matriz = pluma.matriz;

	// //TINTERO
	mat4.translate(tintero.matriz, tintero.matriz, [-10.6,6.6,-1.5]);
	mat4.scale(tintero.matriz, tintero.matriz, [1,1,1]);

	// //CALAVERA
	mat4.translate(calavera.matriz, calavera.matriz,[-8.1,1.5,-4.1]);
	mat4.scale(calavera.matriz, calavera.matriz, [2,2,2]);
	calaveraS.matriz = calavera.matriz;

	// //CONTENEDOR
	mat4.translate(contenedor.matriz, contenedor.matriz, [-10.7,6.9,-3.6]);
	mat4.scale(contenedor.matriz, contenedor.matriz, [0.1,0.1,0.1]);

	// // LIBRO
	let matriz = mat4.create();
	mat4.translate(matriz, matriz, [-8.6,6.09,-4.1]);
	mat4.rotateY(matriz, matriz, 1.53);
	mat4.rotateX(matriz, matriz, 0.3);
	cuerpo_fondo.matriz = matriz;
	cuerpo_frente.matriz = matriz;
	lomo.matriz = matriz;
	pagina_fondo.matriz = matriz;
	pagina_frente.matriz = matriz;
	pagina_medio.matriz = matriz;

	// //ATRIL
	mat4.translate(atril.matriz,atril.matriz,[-8.3,-2.5,-4.1]);
	mat4.scale(atril.matriz, atril.matriz, [1.5,1.5,1.5]);
	atrilS.matriz = atril.matriz;

	// // BANQUETA
	mat4.translate(banqueta.matriz,banqueta.matriz,[-2.7,-5.6,-5.6]);
	mat4.rotateY(banqueta.matriz,banqueta.matriz,40*Math.PI/180);  
	mat4.scale(banqueta.matriz,banqueta.matriz,[1.8,1.8,1.8]);
	banquetaS.matriz = banqueta.matriz;

	// // MESA
	mat4.translate(mesa.matriz,mesa.matriz,[4.3,-5.6,7.4]);
	mat4.scale(mesa.matriz,mesa.matriz,[3,3,3]);
	mesaS.matriz = mesa.matriz;

	// // RELOJ
	matriz = mat4.create();
	mat4.translate(matriz, matriz, vector_traslacion_reloj);
	mat4.rotateY(matriz, matriz, Math.PI/2);
	mat4.scale(matriz,matriz,[0.2,0.2,0.2]);
	reloj_blanco.matriz = matriz;
	reloj_numeros_negros.matriz = matriz;
	reloj_oro.matriz = matriz;
	reloj_madera.matriz = matriz;
	reloj_maderaS.matriz = matriz;

	reloj_placa_pendulo.matriz = mat4.clone(matriz)
	mat4.translate(reloj_placa_pendulo.matriz, reloj_placa_pendulo.matriz, [0,0,1]);
	reloj_pendulo_oro.matriz = mat4.clone(matriz);
	reloj_pendulo_blanco.matriz = mat4.clone(matriz);
	mat4.rotateZ(reloj_pendulo_oro.matriz, reloj_pendulo_oro.matriz, -5*Math.PI/180);
	mat4.rotateZ(reloj_pendulo_blanco.matriz, reloj_pendulo_blanco.matriz, -5*Math.PI/180);
	reloj_pendulo_blancoS.matriz = reloj_pendulo_blanco.matriz;
	reloj_pendulo_oroS.matriz = reloj_pendulo_oro.matriz;

	let matriz_manecillas = mat4.clone(matriz);
	mat4.scale(matriz_manecillas,matriz_manecillas,[10,10,10]);
	mat4.translate(matriz_manecillas, matriz_manecillas, [0.11,-1.24,-0.18]);

	// // MANECILLA SEGUNDO
	manecilla_segundo.matriz = mat4.clone(matriz_manecillas);
	mat4.translate(manecilla_segundo.matriz, manecilla_segundo.matriz, [0,0.13,0]);
	mat4.scale(manecilla_segundo.matriz,manecilla_segundo.matriz,[0.1,0.1,0.1]);

	// // MANECILLA MINUTO
	mat4.rotateZ(matriz_manecillas, matriz_manecillas, Math.PI);
	manecilla_minuto.matriz = mat4.clone(matriz_manecillas);
	mat4.translate(manecilla_minuto.matriz, manecilla_minuto.matriz, [0,-0.09,0]);
	mat4.scale(manecilla_minuto.matriz,manecilla_minuto.matriz,[0.1,0.1,0.1]);

	// // MANECILLA HORA
	manecilla_hora.matriz = mat4.clone(matriz_manecillas);
	mat4.scale(manecilla_hora.matriz,manecilla_hora.matriz,[0.6,0.6,0.6]);
	mat4.scale(manecilla_hora.matriz,manecilla_hora.matriz,[0.1,0.1,0.1]);

	// // SUELO
	mat4.translate(suelo.matriz,suelo.matriz,[0,-5.9,0]);
	mat4.rotateZ(suelo.matriz,suelo.matriz,Math.PI/2);
	mat4.scale(suelo.matriz,suelo.matriz,[1,2,2]);

	// // PARED
	mat4.translate(pared.matriz, pared.matriz,[-11.7,5.8,0.4]);
	mat4.scale(pared.matriz, pared.matriz, [1,2,2]);

	// // PARED FONDO
	mat4.translate(pared_fondo.matriz, pared_fondo.matriz,[17.3-5.7,5.8,3-2.6]);
	mat4.scale(pared_fondo.matriz, pared_fondo.matriz, [1,2,2]);
	
	// // PUERTA
	mat4.translate(puerta.matriz, puerta.matriz,[17.3-5.7,2.8,3-2.6]);
	mat4.rotateY(puerta.matriz, puerta.matriz,Math.PI/2);
	mat4.scale(puerta.matriz, puerta.matriz, [1.2,1.2,1.2]);

	// // CIELORRASO
	mat4.translate(cielorraso.matriz, cielorraso.matriz,[5.6-5.7,18,2.9-2.6]);
	mat4.scale(cielorraso.matriz, cielorraso.matriz,[0.84,0.68,0.69]);

	// // PARED IZQUIERDA
	mat4.translate(pared_izquierda.matriz, pared_izquierda.matriz, [0,5.8,11.4]);
	mat4.rotateY(pared_izquierda.matriz, pared_izquierda.matriz, Math.PI/2);
	mat4.scale(pared_izquierda.matriz, pared_izquierda.matriz, [1,2,2]);

	// // PARED VENTANA Y MARCO VENTANA
	mat4.translate(pared_ventana.matriz, pared_ventana.matriz, [0,5.8,-11.2]);
	mat4.rotateY(pared_ventana.matriz, pared_ventana.matriz, Math.PI/2);
	mat4.scale(pared_ventana.matriz, pared_ventana.matriz, [1,2,2]);

	mat4.translate(marco_ventana.matriz, marco_ventana.matriz, [0,5.8,-11.2]);
	mat4.rotateY(marco_ventana.matriz, marco_ventana.matriz, Math.PI/2);
	mat4.scale(marco_ventana.matriz, marco_ventana.matriz, [1,2,2]);

	// // ALFOMBRA
	mat4.translate(alfombra.matriz, alfombra.matriz,[5,-5.4,0.4]);
	mat4.scale(alfombra.matriz, alfombra.matriz, [2.5,1,2.5]);

	// // CUADRO
	mat4.translate(marco.matriz, marco.matriz, [-3.7,9,10.6]);
	mat4.rotateY(marco.matriz, marco.matriz, Math.PI);
	mat4.scale(marco.matriz, marco.matriz, [6,6,6]);
	mat4.translate(lienzo.matriz, lienzo.matriz, [-3.7,9,10.6]);
	mat4.rotateY(lienzo.matriz, lienzo.matriz, Math.PI);
	mat4.scale(lienzo.matriz, lienzo.matriz, [6,6,6]);

	// // LIBROS
	mat4.translate(libro_base.matriz, libro_base.matriz, [4.3,0.2,7.4]);
	mat4.rotateY(libro_base.matriz, libro_base.matriz, Math.PI/4+Math.PI);
	mat4.scale(libro_base.matriz, libro_base.matriz, [8,8,8]);

	mat4.translate(libro_resto.matriz, libro_resto.matriz, [4.3,3.4,7.4]);
	mat4.rotateY(libro_resto.matriz, libro_resto.matriz, Math.PI/2+Math.PI+Math.PI/4);
	mat4.scale(libro_resto.matriz, libro_resto.matriz, [8,10,8]);
	libro_restoS.matriz = libro_resto.matriz;

	// // ESTUFA
	matriz = mat4.create();
	mat4.translate(matriz, matriz, [6.3,-5.5,-7.9]);
	mat4.rotateY(matriz, matriz, -Math.PI/2);
	mat4.scale(matriz, matriz, [2,2,2]);
	estufa_interior.matriz = matriz;
	estufa_clara.matriz = matriz;
	estufa_oscura.matriz = matriz;
	estufa_patas.matriz = matriz;
	estufa_claraS.matriz = matriz;
	estufa_oscuraS.matriz = matriz;
	estufa_patasS.matriz = matriz;

	// //CIELO
	mat4.scale(cielo.matriz,cielo.matriz,[800,800,800]);

	// // LUNA
	mat4.translate(luna.matriz, luna.matriz, [-130,220,-400]);
	mat4.scale(luna.matriz,luna.matriz,[15,15,15]);
}

function inicializar_textura(imagen,i) {
	let textura = gl.createTexture();
	textura.image = new Image();
	textura.image.onload = function() { handleLoadedTexture(textura,i);} 
	textura.image.src = imagen;
	return textura;
}

function handleLoadedTexture(textura,i) {
	gl.activeTexture(gl.TEXTURE0+i);
	gl.bindTexture(gl.TEXTURE_2D, textura);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textura.image);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.bindTexture(gl.TEXTURE_2D, null);
}

//------------------- PICKING-------------------------------

function pick (now){
	const now_picking = now ;
	const timeDelta = now_picking - lastDrawTimePicking; // tiempo entre este frame y el anterior
	// Selecciono el objeto y se realiza una transformacion
	if (pickedObject != null && pickedObject.name=='Calavera') {
		// A partir del tiempo que pasó desde el último frame (timeDelta) , se calculan los cambios
		const rotationAngle = timeDelta * rotationSpeedPicking;
		// Rotamos el objeto seleccionado
		mat4.rotateY((pickedObject.modelMatrix), pickedObject.modelMatrix,Utils.toRadian(rotationAngle));
	}

	// Actualiza vista en caso de cambios en el tamaño del canvas  
	updateView (gl, canvas,camara,true);
	lastDrawTimePicking = now_picking ;
}

function updateView(gl,canvas, camara , forceUpdate = false) {
	// actualizamos el tamaño de pantalla del canvas
	const pantalla_ancho =Math.floor (canvas.clientWidth * window.devicePixelRatio);
	const pantalla_altura =Math.floor (canvas.clientHeight * window.devicePixelRatio);

	// se compara el tamaño de buffer del canvas ( numero de pixeles) con el tamaño de pantalla 
	if (forceUpdate || (canvas.width !== pantalla_ancho) || (canvas.height !== pantalla_altura)) {
		canvas.width = pantalla_ancho;
		canvas.height = pantalla_altura;

		// Relacion de aspecto de la camara 
		camara.aspect = pantalla_ancho/pantalla_altura;
		camara.proyeccion();

		// Se actualiza el mapeo de coordenada de espacio de clippping [de -1 a 1 ] a pixeles en pantalla
		gl.viewport(0,0,pantalla_ancho, pantalla_altura);
	}
}


function activar_sombra() {
    gl.activeTexture(gl.TEXTURE0)
	gl.bindTexture(gl.TEXTURE_2D, depthTexture);
	
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.enable(gl.DEPTH_TEST)

	const level = 0;
	const internalFormat = gl.DEPTH_COMPONENT16;
	const border = 0;
	const format = gl.DEPTH_COMPONENT;
	const type = gl.UNSIGNED_INT;
	const data = null;
	const SHADOW_MAP_SIZE = 1024

	gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
				SHADOW_MAP_SIZE, SHADOW_MAP_SIZE, border,
				format, type, data);

	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_FUNC, gl.LEQUAL);

	gl.bindTexture(gl.TEXTURE_2D, depthTexture)

	var fb = gl.createFramebuffer();
	gl.bindFramebuffer(gl.FRAMEBUFFER, fb);

	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depthTexture, level);


	gl.useProgram(depth.shader_program);
	gl.uniformMatrix4fv(depth.u_matriz_luz_vista, false, cameraLViewMatrix);
	gl.uniformMatrix4fv(depth.u_matriz_luz_proyeccion, false, luzCamara.proyeccion());
	

	gl.clear( gl.DEPTH_BUFFER_BIT)

	gl.cullFace(gl.FRONT)

	gl.viewport(0, 0, SHADOW_MAP_SIZE, SHADOW_MAP_SIZE)

	for (const object of arregloObjS) {
		gl.uniformMatrix4fv(depth.u_matriz_modelo, false, object.matriz);
		gl.bindVertexArray(object.vao);
		gl.drawElements(gl.TRIANGLES, object.cant_indices, gl.UNSIGNED_INT, 0);
		gl.bindVertexArray(null);
	}

	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

	gl.cullFace(gl.BACK)

	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, depthTexture);

	gl.useProgram(phong.shader_program);
	gl.uniform1i(phong.u_mapa_de_sombra, 0);
	gl.uniformMatrix4fv(phong.u_matriz_luz_vista, false, cameraLViewMatrix)
	gl.uniformMatrix4fv(phong.u_matriz_luz_proyeccion, false, luzCamara.proyeccion());
	// updateView(gl,canvas,camara);
	gl.viewport(50, 50, canvas.width, canvas.height);


	gl.useProgram(null);
	gl.useProgram(phong_madera.shader_program);
	gl.uniform1i(phong_madera.u_mapa_de_sombra, 0);
	gl.uniform1i(phong_madera.u_tiene_sombra, 1);
	gl.uniformMatrix4fv(phong_madera.u_matriz_luz_vista, false, cameraLViewMatrix)
	gl.uniformMatrix4fv(phong_madera.u_matriz_luz_proyeccion, false, luzCamara.proyeccion());


	gl.useProgram(null);

	gl.useProgram(cook_torrance.shader_program);
	gl.uniform1i(cook_torrance.u_mapa_de_sombra, 0);
	gl.uniform1i(cook_torrance.u_tiene_sombra,1);
	gl.uniformMatrix4fv(cook_torrance.u_matriz_luz_vista, false, cameraLViewMatrix)
	gl.uniformMatrix4fv(cook_torrance.u_matriz_luz_proyeccion, false, luzCamara.proyeccion());
	
	gl.useProgram(null);

	gl.useProgram(normal_map.shader_program);
	gl.uniform1i(normal_map.u_mapa_de_sombra, 0);
	gl.uniform1i(normal_map.u_tiene_sombra,1);
	gl.uniformMatrix4fv(normal_map.u_matriz_luz_vista, false, cameraLViewMatrix)
	gl.uniformMatrix4fv(normal_map.u_matriz_luz_proyeccion, false, luzCamara.proyeccion());

	gl.useProgram(null);

	gl.useProgram(phong.shader_program);
	gl.uniform1i(phong.u_mapa_de_sombra, 0);
	gl.uniform1i(phong.u_tiene_sombra,1);
	gl.uniformMatrix4fv(phong.u_matriz_luz_vista, false, cameraLViewMatrix)
	gl.uniformMatrix4fv(phong.u_matriz_luz_proyeccion, false, luzCamara.proyeccion());
	

	gl.useProgram(null);
}
