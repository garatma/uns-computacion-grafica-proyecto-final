var gl, canvas;

// Variables Auxiliares para los shaders
var normalmap, cook_torrance_no_tex;
var phong, shader_depth, phong_madera;

//Texturas
var textura_difusa_pared, textura_oclusion_ambiente_pared, textura_normal_pared;
var textura_difusa_suelo, textura_oclusion_ambiente_suelo, textura_normal_suelo;
var textura_difusa_lienzo, textura_oclusion_ambiente_lienzo, textura_normal_lienzo;
var textura_pagfrente, textura_cuerpo_fondo, textura_cuerpo_frente, textura_pagmediofondo, textura_lomo;
var textura_difusa_farol, textura_normal_farol, textura_spec_farol;
var textura_calavera;
var texturas_difusas = new Array(5);
var texturas_normales = new Array(5);
var texturas_seleccionadas = [1.0,1.0,1.0];
var depthTexture;

var textura_pluma, textura_contenedor, textura_difusa_librobase, textura_normal_librobase, textura_spec_librobase;

//Aux variables
var camara, luzCamara,  picking;
var fullscreen=false;
var lastDrawTimePicking;
var rotationSpeedPicking = 30;
var pickedObject = null ; //Objeto actualmente seleccionado
var ocultar=false;
var mostrar_interfaz=false;

// Objetos que conforman la escena
var pluma, plumaS, contenedor, contenedorS, tintero, tinteroS, farol, alfombra;
var estufa_clara, estufa_claraS, estufa_oscura, estufa_oscuraS, estufa_interior,estufa_patas, estufa_patasS;
var marco, lienzo;
var reloj_madera, reloj_maderaS;
var cuerpo_fondo, cuerpo_frente, pagina_fondo, pagina_frente, pagina_medio, lomo;
var pared, suelo;
var atril, atrilS;
var mesa, mesaS;
var calavera, calaveraS;
var banqueta, banquetaS;
var marco_ventana, pared_ventana;
var libro_base, libro_resto, libro_restoS;
var vela, velaS, vela_base;
var arregloObj, arregloObjS;

var luz_farol;


//Reloj
var vector_traslacion_reloj = [-9,12,6.4];
var angulo_viejo_hora = 0, angulo_viejo_minutos = 0, angulo_viejo_segundos = 0;
var segundo_viejo;
var hora_vieja;
var cant_toques_campana = 0;
var escala_vela = vec3.create();
var vela_apagada = false;
var rnd = 0;

var manecilla_hora, manecilla_minuto, manecilla_segundo;
var reloj_blanco, reloj_madera, reloj_numeros_negros, reloj_oro, reloj_pendulo_blanco, reloj_pendulo_oro,reloj_placa_pendulo;
var high_tick;
var low_tick;
var bell;


// Pendulo
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
var luz_spot, luz_direccional, luz_puntual, luces = [];
var luz_seleccionada = 0;

var cameraLViewMatrix;

function onLoad() {
	canvas = document.getElementById('webglCanvas');
	gl = canvas.getContext('webgl2');

	declarar_shaders();
	declarar_objetos();
	declarar_texturas();

	gl.clearColor(0,0,0,1);
	// gl.enable(gl.DEPTH_TEST);
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
	gl.enable(gl.CULL_FACE);

	document.oncontextmenu = function() { return false; }

	camara = new Camara(canvas);
	document.oncontextmenu = function() { return false; }
	
	picking = new Picking(canvas, camara);

	inicializar_luces();
	luz_puntual.posicion = [7.3,9,9.7];//[1.6,9,9.7];// [7.3,9,12.3];//[-2,3,2];  13 9 12.3
	luz_vela.intensidad = [1,0.57,0.16];

	let pos = Utils.cartesianas_a_esfericas(luz_puntual.posicion);
	const fovy = 40;
	const aspect = -1.1;
	const nearL = 1;
	const farL = -0.6;// -0.26;
	luzCamara = new CamaraSombras(pos[0], pos[1], pos[2], fovy, aspect, nearL, farL);
	cameraLViewMatrix = mat4.create();
	mat4.lookAt(cameraLViewMatrix, luz_puntual.posicion, [-20,-23.7331,0], [0,0,1]);// -20 -7.22 

	posicionar_objetos();

	depthTexture = gl.createTexture();

	high_tick = document.getElementById("high_tick");
	low_tick = document.getElementById("low_tick");
	bell = document.getElementById("bell");

	segundo_viejo = new Date().getSeconds();
	hora_vieja = new Date().getHours()%12;
	
	lastDrawTime = 0;
	lastDrawTimePicking = 0;

	// se empieza a dibujar por cuadro
	requestAnimationFrame(onRender)
}

function onRender(now) {
    now *= 0.001                // milisegundos -> segundos
	const timeDelta = now - lastDrawTime // tiempo entre este frame y el anterior	
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	mover_pendulo(timeDelta);
	rotar_manecilla_segundo();
	rotar_manecilla_minuto();
	rotar_manecilla_hora();
	pick(now);
	if (!vela_apagada) achicar_vela();

	ActivarSombra();

	draw_with_Shader_CookTorrance();
	draw_with_Shader_Phong_ProceduralMadera();
	draw_with_Shader_Phong();
	draw_with_Shader_NormalMap();

	lastDrawTime = now;
	requestAnimationFrame(onRender);
}

function draw_with_Shader_CookTorrance(){
	gl.useProgram(cook_torrance_no_tex.shader_program);
	dibujar(cook_torrance_no_tex, marco);
	dibujar(cook_torrance_no_tex, estufa_clara);
	dibujar(cook_torrance_no_tex, estufa_oscura);
	dibujar(cook_torrance_no_tex, estufa_interior);
	dibujar(cook_torrance_no_tex, tintero);
	dibujar(cook_torrance_no_tex, vela);
	dibujar(cook_torrance_no_tex, vela_base);
	dibujar(cook_torrance_no_tex,reloj_blanco);
	dibujar(cook_torrance_no_tex,reloj_numeros_negros);
	dibujar(cook_torrance_no_tex,reloj_oro);
	dibujar(cook_torrance_no_tex,reloj_pendulo_oro);
	dibujar(cook_torrance_no_tex,reloj_pendulo_blanco);

	gl.uniform1i(cook_torrance_no_tex.u_tiene_sombra,0);

	luz_farol = luz_puntual;

	if ( !vela_apagada ) {
		luz_farol.intensidad[0] += 10;
		luz_farol.intensidad[1] += 10;
		luz_farol.intensidad[2] += 10;
		dibujar(cook_torrance_no_tex, llama);
		luz_farol.intensidad[0] -= 10;
		luz_farol.intensidad[1] -= 10;
		luz_farol.intensidad[2] -= 10;
	}

	dibujar(cook_torrance_no_tex, manecilla_hora);
	dibujar(cook_torrance_no_tex, manecilla_minuto);
	dibujar(cook_torrance_no_tex, manecilla_segundo);
	gl.useProgram(null);
}

function draw_with_Shader_Phong_ProceduralMadera(){
	gl.useProgram(phong_madera.shader_program);
	dibujar(phong_madera, reloj_madera);
	dibujar(phong_madera,atril);
	dibujar(phong_madera,banqueta);
	dibujar(phong_madera, estufa_patas);
	dibujar(phong_madera,mesa);

	gl.uniform1i(phong_madera.u_tiene_sombra,0);
	dibujar(phong_madera,marco_ventana);
	gl.useProgram(null);
}

function draw_with_Shader_Phong(){
	gl.useProgram(phong.shader_program);

	gl.activeTexture(gl.TEXTURE1);

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

	dibujar(phong, contenedor);

	dibujar(phong, pagina_frente);
	dibujar(phong, pagina_medio);
	dibujar(phong, lomo);
	dibujar(phong, pagina_fondo);
	dibujar(phong, cuerpo_fondo);
	dibujar(phong, cuerpo_frente);
	
	dibujar(phong, calavera);
	dibujar(phong, alfombra);
	dibujar(phong,reloj_placa_pendulo);

	gl.useProgram(null);
}

function draw_with_Shader_NormalMap(){
	gl.useProgram(normalmap.shader_program);
	gl.uniform3f(normalmap.u_texturas_seleccionadas,texturas_seleccionadas[0],texturas_seleccionadas[1],texturas_seleccionadas[2]);
	dibujar(normalmap, libro_base);
	dibujar(normalmap, suelo); 
	dibujar(normalmap, pared);
	dibujar(normalmap, pared_ventana);

	luz_farol = luz_puntual;
	
	gl.uniform1i(normalmap.u_tiene_sombra,0);
	dibujar(normalmap, pared_izquierda);
	luz_puntual.posicion[0] += 0.7;
	luz_puntual.posicion[1] -= 10;
	luz_farol.intensidad[0] += 5;
	luz_farol.intensidad[1] += 5;
	luz_farol.intensidad[2] += 10;
	dibujar(normalmap, farol);
	luz_puntual.posicion[0] -= 0.7;
	luz_puntual.posicion[1] += 10;
	luz_farol.intensidad[0] -= 5;
	luz_farol.intensidad[1] -= 5;
	luz_farol.intensidad[2] -= 10;

	dibujar(normalmap, lienzo);

	for ( let i = 1; i < 6; i++ ) {
		mat4.translate(libro_resto.matriz, libro_resto.matriz, [0,-0.05,0]);
		mat4.rotateY(libro_resto.matriz, libro_resto.matriz, Math.cos(i));
		libro_resto.texturas.push(texturas_difusas[i]);
		libro_resto.texturas.push(texturas_normales[i]);
		libro_resto.texturas.push(textura_especular);
		dibujar(normalmap, libro_resto);
		libro_resto.texturas.pop();
		libro_resto.texturas.pop();
		libro_resto.texturas.pop();
		mat4.rotateY(libro_resto.matriz, libro_resto.matriz, -Math.cos(i));
	}
	mat4.translate(libro_resto.matriz, libro_resto.matriz, [0,0.05*5,0]);


	gl.useProgram(null);
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

function achicar_vela() {
	mat4.getScaling(scaling,vela.matriz);
	let razon = scaling[1]/escala_vela;
	luz_vela.atenuacion[0] -= rnd;
	rnd = Math.pow(-1,Utils.random(0,1))*Utils.random(0,2)/10
	luz_vela.atenuacion[0] = 0;
	if ( scaling[1] > 0.2 ) {
		mat4.scale(vela.matriz,vela.matriz,[1,0.9999,1]);
		if ( scaling[1] > 0.4 ) {
			mat4.translate(llama.matriz,llama.matriz,[0,-0.00028,0]);
			luz_vela.posicion[1] -= 0.00028*0.4;
		}
		else {
			mat4.translate(llama.matriz,llama.matriz,[0,-0.00018,0]);
			luz_vela.posicion[1] -= 0.00018*0.4;
		}
		luz_vela.atenuacion[0] += 1-razon+rnd;
	}
	else {
		luz_vela.atenuacion = [100,100,100];
		vela_apagada = true;
		document.getElementById("boton_vela").style.setProperty('color', 'green');
		document.getElementById("boton_vela").disabled = false;
	}
}

//....................................................

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

function inicializar_textura(imagen,i) {
	let textura = gl.createTexture();
	textura.image = new Image();
	textura.image.onload = function() { handleLoadedTexture(textura,i); }
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

function declarar_shaders() {
	phong = new Phong(gl);
	normalmap = new NormalMap(gl);
	phong_madera = new PhongMadera(gl);
	cook_torrance_no_tex = new CookTorrance(gl);
	shader_depth = new Depth(gl);
}

function declarar_objetos() {
	pluma = new Model(pluma_obj,10,phong.loc_posicion,phong.loc_normal,phong.loc_textura);
	plumaS = new Model(pluma_obj,null,shader_depth.loc_posicion,null,null);

	contenedor = new Model(contenedor_obj,10,phong.loc_posicion,phong.loc_normal,phong.loc_textura);
	contenedorS = new Model(contenedor_obj,null,shader_depth.loc_posicion,null,null);

	mesa = new Model (mesa_obj,material_atril,phong_madera.loc_posicion,phong_madera.loc_normal,phong_madera.loc_textura);
	mesaS = new Model (mesa_obj,null,shader_depth.loc_posicion,null,null);

	marco_ventana = new Model(marco_ventana_obj,material_atril,phong_madera.loc_posicion,phong_madera.loc_normal,phong_madera.loc_textura);

	pared_ventana = new Model(pared_ventana_obj,10,normalmap.loc_posicion,normalmap.loc_normal,normalmap.loc_textura);
	
	tintero = new Model(tintero_obj,material_tintero,cook_torrance_no_tex.loc_posicion,cook_torrance_no_tex.loc_normal,cook_torrance_no_tex.loc_textura);
	tinteroS = new Model(tintero_obj,null,shader_depth.loc_posicion,null,null);

	vela = new Model(vela_obj,material_vela,cook_torrance_no_tex.loc_posicion,cook_torrance_no_tex.loc_normal,cook_torrance_no_tex.loc_textura);
	velaS = new Model(vela_obj,null,shader_depth.loc_posicion,null,null);

	vela_base = new Model(vela_base_obj,material_oro,cook_torrance_no_tex.loc_posicion,cook_torrance_no_tex.loc_normal,cook_torrance_no_tex.loc_textura);

	llama = new Model(llama_obj,material_llama,cook_torrance_no_tex.loc_posicion,cook_torrance_no_tex.loc_normal,null);
	
	calavera = new Model (calavera_obj,10,phong.loc_posicion,phong.loc_normal,phong.loc_textura);
	calaveraS = new Model(calavera_obj,10,shader_depth.loc_posicion,null,null);

	suelo = new Model (pared_obj,10,normalmap.loc_posicion,normalmap.loc_normal,normalmap.loc_textura);

	atril = new Model(atril_obj,material_atril,phong_madera.loc_posicion,phong_madera.loc_normal,phong_madera.loc_textura);
	atrilS = new Model(atril_obj,null,shader_depth.loc_posicion,null,null);

	reloj_madera = new Model(reloj_madera_obj,material_atril,phong_madera.loc_posicion,phong_madera.loc_normal,phong_madera.loc_textura);
	reloj_maderaS = new Model(reloj_madera_obj,null,shader_depth.loc_posicion,null,null);

	banqueta = new Model(banqueta_obj,material_atril,phong_madera.loc_posicion,phong_madera.loc_normal,phong_madera.loc_textura);
	banquetaS = new Model(banqueta_obj,null,shader_depth.loc_posicion,null,null);

	pared = new Model (pared_obj,10,normalmap.loc_posicion,normalmap.loc_normal,normalmap.loc_textura);

	pared_izquierda =new Model (pared_obj,10,normalmap.loc_posicion,normalmap.loc_normal,normalmap.loc_textura);

	farol = new Model(farol_obj,10,normalmap.loc_posicion,normalmap.loc_normal,normalmap.loc_textura);

	alfombra = new Model(alfombra_obj,10,phong.loc_posicion,phong.loc_normal,phong.loc_textura);

	marco = new Model(marco_obj,material_oro,cook_torrance_no_tex.loc_posicion,cook_torrance_no_tex.loc_normal,cook_torrance_no_tex.loc_textura);	

	lienzo = new Model(lienzo_obj,10,normalmap.loc_posicion,normalmap.loc_normal,normalmap.loc_textura);
	libro_base = new Model(libro_base_obj,10,normalmap.loc_posicion,normalmap.loc_normal,normalmap.loc_textura);

	libro_resto = new Model(libro_resto_obj,10,normalmap.loc_posicion,normalmap.loc_normal,normalmap.loc_textura);
	libro_restoS = new Model(libro_resto_obj,null,shader_depth.loc_posicion,null,null);

	reloj_blanco = new Model(reloj_blanco_obj,material_blanco,cook_torrance_no_tex.loc_posicion,cook_torrance_no_tex.loc_normal,cook_torrance_no_tex.loc_textura);
	reloj_numeros_negros = new Model(reloj_numeros_negros_obj,material_negro,cook_torrance_no_tex.loc_posicion,cook_torrance_no_tex.loc_normal,cook_torrance_no_tex.loc_textura);
	reloj_oro = new Model(reloj_oro_obj,material_oro,cook_torrance_no_tex.loc_posicion,cook_torrance_no_tex.loc_normal,cook_torrance_no_tex.loc_textura);

	reloj_pendulo_blanco = new Model(reloj_pendulo_blanco_obj,material_blanco,cook_torrance_no_tex.loc_posicion,cook_torrance_no_tex.loc_normal,cook_torrance_no_tex.loc_textura);
	reloj_pendulo_blancoS = new Model(reloj_pendulo_blanco_obj, null, shader_depth.loc_posicion,null,null);
	reloj_pendulo_oro = new Model(reloj_pendulo_oro_obj,material_oro,cook_torrance_no_tex.loc_posicion,cook_torrance_no_tex.loc_normal,cook_torrance_no_tex.loc_textura);
	reloj_pendulo_oroS = new Model(reloj_pendulo_oro_obj,null,shader_depth.loc_posicion,null,null);
	reloj_placa_pendulo = new Model(reloj_placa_pendulo_obj,10,phong.loc_posicion,phong.loc_normal,phong.loc_textura);

	manecilla_hora = new Model(manecilla_minuto_hora_obj,material_negro,cook_torrance_no_tex.loc_posicion,cook_torrance_no_tex.loc_normal,cook_torrance_no_tex.loc_textura);
	manecilla_minuto = new Model(manecilla_minuto_hora_obj,material_negro,cook_torrance_no_tex.loc_posicion,cook_torrance_no_tex.loc_normal,cook_torrance_no_tex.loc_textura);
	manecilla_segundo = new Model(manecilla_segundo_obj,material_negro,cook_torrance_no_tex.loc_posicion,cook_torrance_no_tex.loc_normal,cook_torrance_no_tex.loc_textura);

	estufa_clara = new Model(estufa_clara_obj,material_negro_claro,cook_torrance_no_tex.loc_posicion,cook_torrance_no_tex.loc_normal,cook_torrance_no_tex.loc_textura);
	estufa_claraS = new Model(estufa_clara_obj,null,shader_depth.loc_posicion,null,null);

	estufa_oscura = new Model(estufa_oscura_obj,material_negro_estufa,cook_torrance_no_tex.loc_posicion,cook_torrance_no_tex.loc_normal,cook_torrance_no_tex.loc_textura);
	estufa_oscuraS = new Model(estufa_oscura_obj,null,shader_depth.loc_posicion,null,null);

	estufa_interior = new Model(estufa_interior_obj,material_interior_estufa,cook_torrance_no_tex.loc_posicion,cook_torrance_no_tex.loc_normal,cook_torrance_no_tex.loc_textura);
	
	estufa_patas = new Model(estufa_patas_obj,material_atril,phong_madera.loc_posicion,phong_madera.loc_normal,phong_madera.loc_textura);
	estufa_patasS = new Model(estufa_patas_obj,null,shader_depth.loc_posicion,null,null);

	pagina_frente = new Model(pagina_frente_obj,10,phong.loc_posicion,phong.loc_normal,phong.loc_textura);
	pagina_fondo = new Model(pagina_fondo_obj,10,phong.loc_posicion,phong.loc_normal,phong.loc_textura);
	pagina_medio = new Model(pagina_medio_obj,10,phong.loc_posicion,phong.loc_normal,phong.loc_textura);
	lomo = new Model(lomo_obj,10,phong.loc_posicion,phong.loc_normal,phong.loc_textura);
	cuerpo_fondo = new Model(cuerpo_fondo_obj,10,phong.loc_posicion,phong.loc_normal,phong.loc_textura);
	cuerpo_frente = new Model(cuerpo_frente_obj,10,phong.loc_posicion,phong.loc_normal,phong.loc_textura);

	arregloObjS = [velaS,mesaS,tinteroS, calaveraS,reloj_maderaS, banquetaS,atrilS,plumaS,contenedorS, libro_restoS, estufa_claraS ,estufa_patasS, estufa_oscuraS, reloj_pendulo_blanco, reloj_pendulo_oro];
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
	pluma.niveles++; contenedor.niveles++;
	textura = inicializar_textura("../Modelos/pluma/textura_pluma.jpg",pluma.niveles++);
	pluma.texturas.push(textura);
	textura = inicializar_textura("../Modelos/pluma/textura_contenedor.jpg",contenedor.niveles++);
	contenedor.texturas.push(textura);

	// paredes
	pared.niveles++;
	textura = inicializar_textura("../Modelos/pared/textura_difusa.jpg",pared.niveles++);
	pared.texturas.push(textura);
	pared_izquierda.texturas.push(textura);
	pared_ventana.texturas.push(textura);
	textura = inicializar_textura("../Modelos/pared/textura_normal.jpg",pared.niveles++);
	pared.texturas.push(textura);
	pared_izquierda.texturas.push(textura);
	pared_ventana.texturas.push(textura);
	textura = inicializar_textura("../Modelos/pared/textura_oclusion_ambiente.jpg",pared.niveles++);
	pared.texturas.push(textura);
	pared_izquierda.texturas.push(textura);
	pared_izquierda.niveles = 4;
	pared_ventana.texturas.push(textura);
	pared_ventana.niveles = 4;

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

	// alfombra
	alfombra.niveles++
	textura = inicializar_textura("../Modelos/alfombra/textura_difusa.jpg",alfombra.niveles++);
	alfombra.texturas.push(textura);

	// // libro del atril
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
	
	// // placa del péndulo
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

	// lienzo
	lienzo.niveles++;
	textura = inicializar_textura("../Modelos/cuadro/textura_difusa.jpg",lienzo.niveles++);
	lienzo.texturas.push(textura);
	textura = inicializar_textura("../Modelos/cuadro/textura_normal.png",lienzo.niveles++);
	lienzo.texturas.push(textura);
	textura = inicializar_textura("../Modelos/cuadro/textura_especular.png",lienzo.niveles++);
	lienzo.texturas.push(textura);	
 }

function posicionar_objetos() {
	// VELA, BASE y LLAMA
	mat4.translate(vela_base.matriz, vela_base.matriz, [-10.7,6.7,-6]);
	mat4.scale(vela_base.matriz, vela_base.matriz, [0.1,0.1,0.1]);

	mat4.translate(vela.matriz, vela.matriz, [-10.7,6.7,-6]);
	mat4.scale(vela.matriz, vela.matriz, [0.3,1,0.3]);
	// mat4.translate(velaS.matriz, velaS.matriz, [-10.7,6.7,-6]);
	// mat4.scale(velaS.matriz, velaS.matriz, [0.3,1,0.3]);
	//mat4.getScaling(escala_vela, vela.matriz);
	//escala_vela = escala_vela[1];

	mat4.translate(llama.matriz, llama.matriz, [-10.7,7.7,-6]);
	mat4.scale(llama.matriz, llama.matriz, [0.4,0.5,0.4]);

	// FAROL
	mat4.translate(farol.matriz, farol.matriz,[8,6,9.7] );
	mat4.rotateY(farol.matriz, farol.matriz, Math.PI);
	mat4.scale(farol.matriz,farol.matriz,[10,10,10]);

	//PLUMA
	mat4.translate(pluma.matriz, pluma.matriz, [-11,7.8,-1.5]);
	mat4.scale(pluma.matriz, pluma.matriz, [0.1,0.1,0.1]);
	// mat4.translate(plumaS.matriz, plumaS.matriz, [-5,7.8,-1]);
	// mat4.scale(plumaS.matriz, plumaS.matriz, [0.1,0.1,0.1]);

	//TINTERO
	mat4.translate(tintero.matriz, tintero.matriz, [-10.7,6.7,-3.6]);
	mat4.scale(tintero.matriz, tintero.matriz, [1,1,1]);
	
	// mat4.translate(tinteroS.matriz, tinteroS.matriz, [-5,6.7,-1]);
	// mat4.scale(tinteroS.matriz, tinteroS.matriz, [1,1,1]);
	
	//CALAVERA
	mat4.translate(calavera.matriz, calavera.matriz,[-8.1,1.5,-4.1]);// [-2.4,1.5,-1.5]);
	mat4.scale(calavera.matriz, calavera.matriz, [2,2,2]);

	// mat4.translate(calaveraS.matriz, calaveraS.matriz, [-8.1,1.5,-4.1]);
	// mat4.scale(calaveraS.matriz, calaveraS.matriz, [2,2,2]);

	//CONTENEDOR
	mat4.translate(contenedor.matriz, contenedor.matriz, [-10.7,6.9,-1.5]);
	mat4.scale(contenedor.matriz, contenedor.matriz, [0.1,0.1,0.1]);
	// mat4.translate(contenedorS.matriz, contenedorS.matriz, [-5,6.9,1.1]);
	// mat4.scale(contenedorS.matriz, contenedorS.matriz, [0.1,0.1,0.1]);

	//ATRIL
	mat4.translate(atril.matriz,atril.matriz,[-8.3,-2.5,-4.1]);
	mat4.scale(atril.matriz, atril.matriz, [1.5,1.5,1.5]);
	// mat4.translate(atrilS.matriz,atrilS.matriz,[-8.3,-2.5,-4.1]);
	// mat4.scale(atrilS.matriz, atrilS.matriz, [1.5,1.5,1.5]);
	
	// BANQUETA
	mat4.translate(banqueta.matriz,banqueta.matriz,[-2.7,-5.6,-5.6]);
	mat4.rotateY(banqueta.matriz,banqueta.matriz,40*Math.PI/180);  
	mat4.scale(banqueta.matriz,banqueta.matriz,[1.8,1.8,1.8]);
	// mat4.translate(banquetaS.matriz,banquetaS.matriz,[-2.7,-5.6,-5.6]);
	// mat4.rotateY(banquetaS.matriz,banquetaS.matriz,40*Math.PI/180);
	// mat4.scale(banquetaS.matriz,banquetaS.matriz,[1.8,1.8,1.8]);

	//MESA
	mat4.translate(mesa.matriz,mesa.matriz,[4.3,-5.6,7.4]);
	mat4.scale(mesa.matriz,mesa.matriz,[3,3,3]);
	// mat4.translate(mesaS.matriz,mesaS.matriz,[4.3,-5.6,7.4]);
	// mat4.scale(mesaS.matriz,mesaS.matriz,[3,3,3]);

	//SUELO
	mat4.translate(suelo.matriz,suelo.matriz,[0,-5.9,0]);
	mat4.rotateZ(suelo.matriz,suelo.matriz,Math.PI/2);
	mat4.scale(suelo.matriz,suelo.matriz,[1,2,2]);


	// RELOJ
	matriz = mat4.create();
	mat4.translate(matriz, matriz, vector_traslacion_reloj);
	mat4.rotateY(matriz, matriz, Math.PI/2);
	mat4.scale(matriz,matriz,[0.2,0.2,0.2]);
	reloj_madera.matriz = matriz;
	// reloj_maderaS.matriz = matriz;
	reloj_blanco.matriz = matriz;
	reloj_numeros_negros.matriz = matriz;
	reloj_oro.matriz = matriz;

	reloj_placa_pendulo.matriz = mat4.clone(matriz);
	reloj_pendulo_blanco.matriz = mat4.clone(matriz);
	// reloj_pendulo_oroS.matriz = mat4.clone(matriz);
	// reloj_pendulo_blancoS.matriz = mat4.clone(matriz);
	mat4.rotateZ(reloj_pendulo_oro.matriz, reloj_pendulo_oro.matriz, -5*Math.PI/180);
	mat4.rotateZ(reloj_pendulo_blanco.matriz, reloj_pendulo_blanco.matriz, -5*Math.PI/180);
	// mat4.rotateZ(reloj_pendulo_oroS.matriz, reloj_pendulo_oroS.matriz, -5*Math.PI/180);
	// mat4.rotateZ(reloj_pendulo_blancoS.matriz, reloj_pendulo_blancoS.matriz, -5*Math.PI/180);

	mat4.translate(reloj_placa_pendulo.matriz,reloj_placa_pendulo.matriz, [0,0,1]);

	let matriz_manecillas = mat4.clone(matriz);
	mat4.scale(matriz_manecillas,matriz_manecillas,[10,10,10]);
	mat4.translate(matriz_manecillas, matriz_manecillas, [0.11,-1.24,-0.18]);

	// MANECILLA SEGUNDO
	manecilla_segundo.matriz = mat4.clone(matriz_manecillas);
	mat4.translate(manecilla_segundo.matriz, manecilla_segundo.matriz, [0,0.13,0]);
	mat4.scale(manecilla_segundo.matriz,manecilla_segundo.matriz,[0.1,0.1,0.1]);

	// MANECILLA MINUTO
	mat4.rotateZ(matriz_manecillas, matriz_manecillas, Math.PI);
	manecilla_minuto.matriz = mat4.clone(matriz_manecillas);
	mat4.translate(manecilla_minuto.matriz, manecilla_minuto.matriz, [0,-0.09,0]);
	mat4.scale(manecilla_minuto.matriz,manecilla_minuto.matriz,[0.1,0.1,0.1]);

	// MANECILLA HORA
	manecilla_hora.matriz = mat4.clone(matriz_manecillas);
	mat4.scale(manecilla_hora.matriz,manecilla_hora.matriz,[0.6,0.6,0.6]);
	mat4.scale(manecilla_hora.matriz,manecilla_hora.matriz,[0.1,0.1,0.1]);

	// PARED
	mat4.translate(pared.matriz, pared.matriz,[-11.7,5.8,0.4]);
	mat4.scale(pared.matriz, pared.matriz, [1,2,2]);


	// PARED IZQUIERDA
	mat4.translate(pared_izquierda.matriz, pared_izquierda.matriz, [0,5.8,11.4]);
	mat4.rotateY(pared_izquierda.matriz, pared_izquierda.matriz, Math.PI/2);
	mat4.scale(pared_izquierda.matriz, pared_izquierda.matriz, [1,2,2]);

	// PARED VENTANA Y MARCO VENTANA
	mat4.translate(pared_ventana.matriz, pared_ventana.matriz, [0,5.8,-11.2]);
	mat4.rotateY(pared_ventana.matriz, pared_ventana.matriz, Math.PI/2);
	mat4.scale(pared_ventana.matriz, pared_ventana.matriz, [1,2,2]);

	mat4.translate(marco_ventana.matriz, marco_ventana.matriz, [0,5.8,-11.2]);
	mat4.rotateY(marco_ventana.matriz, marco_ventana.matriz, Math.PI/2);
	mat4.scale(marco_ventana.matriz, marco_ventana.matriz, [1,2,2]);

	// CUADRO
	mat4.translate(marco.matriz, marco.matriz, [-3.7,9,10.6]);
	mat4.rotateY(marco.matriz, marco.matriz, Math.PI);
	mat4.scale(marco.matriz, marco.matriz, [6,6,6]);

	mat4.translate(lienzo.matriz, lienzo.matriz, [-3.7,9,10.6]);
	mat4.rotateY(lienzo.matriz, lienzo.matriz, Math.PI);
	mat4.scale(lienzo.matriz, lienzo.matriz, [6,6,6]);

	// LIBROS
	mat4.translate(libro_base.matriz, libro_base.matriz, [4.3,0.2,7.4]);
	mat4.rotateY(libro_base.matriz, libro_base.matriz, Math.PI/4+Math.PI);
	mat4.scale(libro_base.matriz, libro_base.matriz, [8,8,8]);

	mat4.translate(libro_resto.matriz, libro_resto.matriz, [4.3,3.4,7.4]);
	mat4.rotateY(libro_resto.matriz, libro_resto.matriz, Math.PI/2+Math.PI+Math.PI/4);
	mat4.scale(libro_resto.matriz, libro_resto.matriz, [8,10,8]);
	// mat4.translate(libro_restoS.matriz, libro_restoS.matriz, [4.3,3.4,7.4]);
	// mat4.rotateY(libro_restoS.matriz, libro_restoS.matriz, Math.PI/2+Math.PI+Math.PI/4);
	// mat4.scale(libro_restoS.matriz, libro_restoS.matriz, [8,10,8]);

	// LIBRO
	matriz = mat4.create();
	mat4.translate(matriz, matriz, [-8.6,6.09,-4.1]);
	mat4.rotateY(matriz, matriz, 1.53);
	mat4.rotateX(matriz, matriz, 0.3);
	mat4.scale(matriz, matriz, [1,1,1]);
	pagina_fondo.matriz = matriz;
	pagina_frente.matriz = matriz;
	pagina_medio.matriz = matriz;
	lomo.matriz = matriz;
	cuerpo_fondo.matriz = matriz;
	cuerpo_frente.matriz = matriz;

	// ESTUFA
	matriz = mat4.create();
	mat4.translate(matriz, matriz, [6.3,-5.5,-7.9]);
	mat4.rotateY(matriz, matriz, -Math.PI/2);
	mat4.scale(matriz, matriz, [2,2,2]);
	estufa_clara.matriz = matriz;
	estufa_oscura.matriz = matriz;
	estufa_interior.matriz = matriz;
	estufa_patas.matriz = matriz;

	// estufa_claraS.matriz = matriz;
	// estufa_oscuraS.matriz = matriz;
	// estufa_patasS.matriz = matriz;


	// ALFOMBRA
	mat4.translate(alfombra.matriz, alfombra.matriz,[5,-5.4,0.4]);
	mat4.scale(alfombra.matriz, alfombra.matriz, [2.5,1,2.5]);
}



//------------------- PICKING-------------------------------
function bounding_box_objetos () {

	let list_objects =CargarObjetos();
	//Se busca el elemento en el DOM
	let pickerlabel = document.getElementById("picker-label");

	//Registramos el Click del Middle Mouse para seleccionar el objetos
	canvas.addEventListener("mousedown", (event) => {
		if (event.button === 1) {
			// Se dispara el rayo
			pickedObject =picking.pick(list_objects);
			// Verifico el objeto que seleccione
			if (pickedObject != null ) {
				pickerlabel.innerHTML = "<b> Objeto seleccionado : </b>" + pickedObject.name 
				if (pickedObject.name !='Calavera')
				//Funciones utilizando picking para cada objeto en particular
				PickingObjects(pickedObject);
				}
			else {
				pickerlabel.innerHTML = "<b> No hay objeto seleccionado en la escena </b> ";
				if(mostrar_interfaz) {
					SwapInterfaz();
					ocultar=false;
				}
				document.getElementById("TexturasNormalMapping").hidden = ocultar;
				document.getElementById("TexturaProcedural").hidden = ocultar;
				document.getElementById("Luces").hidden = ocultar;
			}
		}	
	})
}
	
function CargarObjetos(){

	// Calavera

	const calaveraboundingbox = new BoundingBox (calavera);

	const scalavera = {
		'name': 'Calavera', 
		'boundingBox' : calaveraboundingbox,
		'geometryData': calavera,
		'modelMatrix': calavera.matriz
	}

	// Vela

	const velaboundingbox = new BoundingBox (vela);

	const svela = {
		'name': 'Vela', 
		'boundingBox' :velaboundingbox,
		'geometryData': vela,
		'modelMatrix': vela.matriz
	}
	// Llama

	const llamaboundingbox = new BoundingBox (llama);

	const sllama = {
		'name': 'Llama', 
		'boundingBox' : llamaboundingbox,
		'geometryData': llama,
		'modelMatrix': llama.matriz
	}

	// Farol

	const farolboundingbox = new BoundingBox (farol);

	const sfarol = {
		'name': 'Farol', 
		'boundingBox' : farolboundingbox,
		'geometryData': farol,
		'modelMatrix': farol.matriz
	}

	// Banqueta

	const banquetaboundingbox = new BoundingBox (banqueta);

	const sbanqueta = {
		'name': 'Banqueta', 
		'boundingBox' : banquetaboundingbox,
		'geometryData': banqueta,
		'modelMatrix': banqueta.matriz
	}

	// Reloj Madera

	const reloj_maderaboundingbox = new BoundingBox (reloj_madera);

	const sreloj_madera = {
		'name': 'Reloj', 
		'boundingBox' : reloj_maderaboundingbox,
		'geometryData': reloj_madera,
		'modelMatrix': reloj_madera.matriz
	}
	
	// Pared Ventana

	const pared_ventanaboundingbox = new BoundingBox (pared_ventana);

	const spared_ventana = {
		'name': 'Pared', 
		'boundingBox' :pared_ventanaboundingbox,
		'geometryData':pared_ventana,
		'modelMatrix':pared_ventana.matriz
	}
	
	// Lienzo
	const lienzoboundingbox = new BoundingBox (lienzo);

	const slienzo = {
		'name': 'Lienzo', 
		'boundingBox' : lienzoboundingbox,
		'geometryData': lienzo,
		'modelMatrix': lienzo.matriz
	}

	//Lista de objetos que podemos seleccionar
	let list_objects = [scalavera,svela, sllama,sfarol,sbanqueta,sreloj_madera,slienzo,spared_ventana];
	//-----------------------------------------------------------------------------------

	return list_objects;

}

function PickingObjects(pickedObject) {
	switch(pickedObject.name) {
		case ('Vela'):
			document.getElementById("luz_seleccionada").value = 0;
			cambiar_luz(0);
			
			Disable_AllTextures();
			break;	
		case ('Llama'):
			document.getElementById("luz_seleccionada").value = 0;
			cambiar_luz(0);
			
			Disable_AllTextures();
			break;	
		case ('Farol'):
			document.getElementById("luz_seleccionada").value = 1;
			cambiar_luz(1);
			
			Disable_AllTextures();
			break;
		case ('Banqueta'):
			
			Disable_Luces_TexturasNormalMapping();
			break;
		case ('Reloj'):
			
			Disable_Luces_TexturasNormalMapping();
			break;
		case ('Pared'):
			
			Disable_Luces_TexturaProcedural();
			break;
		case ('Lienzo'):
				
			Disable_Luces_TexturaProcedural();
			break;
	}
}	

function Disable_AllTextures() {
	ocultar = true;
	if (mostrar_interfaz) {
		document.getElementById("Luces").hidden = !ocultar;
		document.getElementById("TexturasNormalMapping").hidden = ocultar;
		document.getElementById("TexturaProcedural").hidden = ocultar;
	}
	else {
		document.getElementById("Luces").hidden = !ocultar;
		document.getElementById("TexturasNormalMapping").hidden = ocultar;
		document.getElementById("TexturaProcedural").hidden = ocultar;
		SwapInterfaz();
		mostrar_interfaz=true;
	}
}

function Disable_Luces_TexturasNormalMapping() {
	ocultar = true;
	if (mostrar_interfaz) {
		document.getElementById("TexturaProcedural").hidden =!ocultar;
		document.getElementById("TexturasNormalMapping").hidden = ocultar;
		document.getElementById("Luces").hidden = ocultar;
	}
	else {
		document.getElementById("TexturaProcedural").hidden = !ocultar;
		document.getElementById("TexturasNormalMapping").hidden = ocultar;
		document.getElementById("Luces").hidden = ocultar;
		SwapInterfaz();
		mostrar_interfaz=true;
	}
}
	
function Disable_Luces_TexturaProcedural() {
	ocultar = true;
	if (mostrar_interfaz) {
		document.getElementById("TexturasNormalMapping").hidden = !ocultar;
		document.getElementById("TexturaProcedural").hidden = ocultar;
		document.getElementById("Luces").hidden = ocultar;
	}
	else {
		document.getElementById("TexturasNormalMapping").hidden = !ocultar;
		document.getElementById("TexturaProcedural").hidden = ocultar;
		document.getElementById("Luces").hidden = ocultar;
		mostrar_interfaz=true;
		SwapInterfaz();
	
	}
}

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

//-----------------------------------------------------------Sombras---------------------------------------


function ActivarSombra(){
	// primera pasada. generar textura de profundidad
    gl.activeTexture(gl.TEXTURE0)
	gl.bindTexture(gl.TEXTURE_2D, depthTexture);
	
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.enable(gl.DEPTH_TEST)

// make a depth buffer with  the same size as the targetTexture

	// define size and format of level 0
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

	// set the filtering so we don't need mips
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_FUNC, gl.LEQUAL);

	gl.bindTexture(gl.TEXTURE_2D, depthTexture)

	//Create framebuffer and attach the depth texture to the framebuffer
	//FBO
	var fb = gl.createFramebuffer();
	gl.bindFramebuffer(gl.FRAMEBUFFER, fb);

	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depthTexture, level);


	//gl.drawBuffers([gl.NONE])
	gl.useProgram(shader_depth.shader_program);
	gl.uniformMatrix4fv(shader_depth.u_matriz_luz_vista, false, cameraLViewMatrix);
	gl.uniformMatrix4fv(shader_depth.u_matriz_luz_proyeccion, false, luzCamara.proyeccion());
	

	gl.clear( gl.DEPTH_BUFFER_BIT)
	
	// con la siguiente línea se reduce mucho el acne.
	gl.cullFace(gl.FRONT)

	gl.viewport(0, 0, SHADOW_MAP_SIZE, SHADOW_MAP_SIZE)

	for (const object of arregloObjS) {
		gl.uniformMatrix4fv(shader_depth.u_matriz_modelo, false, object.matriz);
		gl.bindVertexArray(object.vao);
		gl.drawElements(gl.TRIANGLES, object.cant_indices, gl.UNSIGNED_INT, 0);
		gl.bindVertexArray(null);
	}

	//segunda pasada.
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

	//disminuir el acne
	gl.cullFace(gl.BACK)

	// gl.colorMask ( true, true, true, true);
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, depthTexture);

	gl.useProgram(phong.shader_program);
	gl.uniform1i(phong.u_mapa_de_sombra, 0);
	gl.uniformMatrix4fv(phong.u_matriz_luz_vista, false, cameraLViewMatrix)
	gl.uniformMatrix4fv(phong.u_matriz_luz_proyeccion, false, luzCamara.proyeccion());
	gl.viewport(50, 50, canvas.width, canvas.height);

	
	//for (const object of arregloObj) dibujar(phong,object);

	gl.useProgram(null);
	gl.useProgram(phong_madera.shader_program);
	gl.uniform1i(phong_madera.u_mapa_de_sombra, 0);
	gl.uniform1i(phong_madera.u_tiene_sombra, 1);
	gl.uniformMatrix4fv(phong_madera.u_matriz_luz_vista, false, cameraLViewMatrix)
	gl.uniformMatrix4fv(phong_madera.u_matriz_luz_proyeccion, false, luzCamara.proyeccion());


	gl.useProgram(null);

	gl.useProgram(cook_torrance_no_tex.shader_program);
	gl.uniform1i(cook_torrance_no_tex.u_mapa_de_sombra, 0);
	gl.uniform1i(cook_torrance_no_tex.u_tiene_sombra,1);
	gl.uniformMatrix4fv(cook_torrance_no_tex.u_matriz_luz_vista, false, cameraLViewMatrix)
	gl.uniformMatrix4fv(cook_torrance_no_tex.u_matriz_luz_proyeccion, false, luzCamara.proyeccion());
	
	gl.useProgram(null);

	gl.useProgram(normalmap.shader_program);
	gl.uniform1i(normalmap.u_mapa_de_sombra, 0);
	gl.uniform1i(normalmap.u_tiene_sombra,1);
	gl.uniformMatrix4fv(normalmap.u_matriz_luz_vista, false, cameraLViewMatrix)
	gl.uniformMatrix4fv(normalmap.u_matriz_luz_proyeccion, false, luzCamara.proyeccion());

	gl.useProgram(null);

	gl.useProgram(phong.shader_program);
	gl.uniform1i(phong.u_mapa_de_sombra, 0);
	gl.uniform1i(phong.u_tiene_sombra,1);
	gl.uniformMatrix4fv(phong.u_matriz_luz_vista, false, cameraLViewMatrix)
	gl.uniformMatrix4fv(phong.u_matriz_luz_proyeccion, false, luzCamara.proyeccion());
	

	gl.useProgram(null);
	//updateView(gl, canvas, camera)
	// Dibujamos los objetos de la escena
	//for (let object of sceneObjects) {  solo calavera
		// phong.setUniformValue("modelViewMatrix", calavera.modelViewMatrix)

}
