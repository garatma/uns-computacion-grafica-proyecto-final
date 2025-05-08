var atributos_farol, atributos_vela,atributos_ambiente;
var mostrar_interfaz = true;
var css_Canvas, css_WebglCanvas, css_Titulo ;

function reset_camara() {
	// camara.r = 0;
	// camara.t = 260*Math.PI/180;
	// camara.f = 40*Math.PI/180;
}

function mover_adelante() {
	direccion_nueva.adelante = !direccion_nueva.adelante;
}

function mover_atras() {
	direccion_nueva.atras = !direccion_nueva.atras;
}

function mover_derecha() {
	direccion_nueva.derecha = !direccion_nueva.derecha;
}

function mover_izquierda() {
	direccion_nueva.izquierda = !direccion_nueva.izquierda;
}

function cambiar_vela() {
	vela.matriz = mat4.create();
	escala_vela = vec3.create();
	mat4.translate(vela.matriz, vela.matriz, [-10.7,6.7,-6]);
	mat4.scale(vela.matriz, vela.matriz, [0.3,1,0.3]);
	velaS.matriz = vela.matriz;
	mat4.getScaling(escala_vela, vela.matriz);
	escala_vela = escala_vela[1];

	llama.matriz = mat4.create();
	mat4.translate(llama.matriz, llama.matriz, [-10.69,7.6,-6.01]);
	mat4.scale(llama.matriz, llama.matriz, [0.4,0.5,0.4]);

	luz_vela.posicion = [-5,8.8,-4];
	luz_vela.atenuacion = [0,0,0];

	rnd = 0;
	document.getElementById("boton_vela").style.setProperty('background-color', 'black');
	document.getElementById("boton_vela").hidden=true;
	vela_apagada = false;
}

// función oyente del combo box. cambia la interfaz según la luz elegida (opcion)
function cambiar_luz(opcion) {
	luz_seleccionada = opcion;

	if ( luz_seleccionada == 0 ) eaint=true;
	else if ( luz_seleccionada == 1 ) eaint=true;
	else luz = eaint =true;

	// se actualizan los sliders
	actualizar_interfaz();
}

function cambiar_lienzo(valor) { 
	textura_lienzo_seleccionado = valor; 
}

function actualizar_texturas(nro,id){
	if(document.getElementById(id).checked) texturas_seleccionadas[nro] = 1.0 ;
	else texturas_seleccionadas[nro] = 0.0;
}

function inicializar_luces() {
	luz_vela = new Light([-5,8.8,-4],[0,0,0],[1,0.57,0.16],0,[0,2,0],1);
	luz_farol = new Light([7.3,9,9.7],[0,0,0],[0.3,0.3,1],0,[0,2,0],1);

	luces.push(luz_farol);
	luces.push(luz_vela);
	luz_ambiente = [0.2,0.2,0.2];

	actualizar_interfaz();
}

// se actualizan los sliders según la luz seleccionada
function actualizar_interfaz() {
	let intensidad; 
	if ( luz_seleccionada == 0) {
		//atenuacion = luz_vela.atenuacion;
		intensidad = luz_vela.intensidad;

		// Atenuación  Luz Vela
		//document.getElementById("aatt").value = parseFloat(atenuacion[0]).toFixed(2);
		//document.getElementById("batt").value = parseFloat(atenuacion[1]).toFixed(2);
		//document.getElementById("catt").value = parseFloat(atenuacion[2]).toFixed(2);
		//UpdateTextInput(7,parseFloat(atenuacion[0]).toFixed(0));
		//UpdateTextInput(8,parseFloat(atenuacion[1]).toFixed(0));
		//UpdateTextInput(9,parseFloat(atenuacion[2]).toFixed(0));

		// Intensidad  Luz Vela
		document.getElementById("rint").value = parseFloat(intensidad[0]*255).toFixed(0);
		document.getElementById("gint").value = parseFloat(intensidad[1]*255).toFixed(0);
		document.getElementById("bint").value = parseFloat(intensidad[2]*255).toFixed(0);
		UpdateTextInput(10,parseFloat(intensidad[0]*255).toFixed(0));
		UpdateTextInput(11,parseFloat(intensidad[1]*255).toFixed(0));
		UpdateTextInput(12,parseFloat(intensidad[2]*255).toFixed(0));

	}
	else{
		if ( luz_seleccionada == 1) {
			//atenuacion = luz_farol.atenuacion;
			intensidad = luz_farol.intensidad;
	
			// Atenuación  Luz Farol
			//document.getElementById("aatt").value = parseFloat(atenuacion[0]).toFixed(2);
			//document.getElementById("batt").value = parseFloat(atenuacion[1]).toFixed(2);
			//document.getElementById("catt").value = parseFloat(atenuacion[2]).toFixed(2);
			//UpdateTextInput(7,parseFloat(atenuacion[0]).toFixed(0));
			//UpdateTextInput(8,parseFloat(atenuacion[1]).toFixed(0));
			//UpdateTextInput(9,parseFloat(atenuacion[2]).toFixed(0));
	
			// Intensidad  Luz Farol
			document.getElementById("rint").value = parseFloat(intensidad[0]*255).toFixed(0);
			document.getElementById("gint").value = parseFloat(intensidad[1]*255).toFixed(0);
			document.getElementById("bint").value = parseFloat(intensidad[2]*255).toFixed(0);
			UpdateTextInput(10,parseFloat(intensidad[0]*255).toFixed(0));
			UpdateTextInput(11,parseFloat(intensidad[1]*255).toFixed(0));
			UpdateTextInput(12,parseFloat(intensidad[2]*255).toFixed(0));
	
		}
		
		else {
			intensidad = luz_ambiente;
			document.getElementById("rint").value = parseFloat(intensidad[0]*255).toFixed(0);
			document.getElementById("gint").value = parseFloat(intensidad[1]*255).toFixed(0);
			document.getElementById("bint").value = parseFloat(intensidad[2]*255).toFixed(0);
			UpdateTextInput(10,parseFloat(intensidad[0]*255).toFixed(0));
			UpdateTextInput(11,parseFloat(intensidad[1]*255).toFixed(0));
			UpdateTextInput(12,parseFloat(intensidad[2]*255).toFixed(0));
		}
	}
	actualizar_interfaz_banqueta();
}

function actualizar_interfaz_banqueta() {
	document.getElementById("ganancia").value = material_banqueta.ganancia;
	document.getElementById("lacunaridad").value = material_banqueta.lacunaridad;
	document.getElementById("octavas").value = material_banqueta.octavas;
	document.getElementById("resolucion0").value = material_banqueta.resolucion[0];
	document.getElementById("resolucion1").value = material_banqueta.resolucion[1];
	// inicializo los valores del slider de lacunaridad , ganancia y octavas de la esfera de mármol
	UpdateTextInput(10,material_banqueta.ganancia);
	UpdateTextInput(11,material_banqueta.lacunaridad);
	UpdateTextInput(12,material_banqueta.octavas);
	UpdateTextInput(13,material_banqueta.resolucion[0]);
	UpdateTextInput(14,material_banqueta.resolucion[1]);
}
	
//-------------------SLIDERS PARA CADA PARAMETRO DE LUZ-----------------

/*Funcion para actualizar el valor en el text del slider*/
function UpdateTextInput(num,val) {
	document.getElementById("textInput"+num).innerText=val;
}

/*function atenuacion(valor,coordenada) {
	if ( luz_seleccionada == 0 ) luz_vela.atenuacion[coordenada] = valor/255;
	else if ( luz_seleccionada == 1 ) luz_farol.atenuacion[coordenada] = valor/255;
	UpdateTextInput(coordenada+7,valor);
}*/

function intensidad(valor, coordenada) {
	if ( luz_seleccionada == 0 ) luz_vela.intensidad[coordenada] = valor/255;
	else if ( luz_seleccionada == 1 ) luz_farol.intensidad[coordenada] = valor/255;
	else  luz_ambiente[coordenada] = valor/255;
	UpdateTextInput(coordenada+10,valor);
}
//--------------------------------------------------------------------------

//-------------------------Sliders parámetros banqueta-----------------------

function lacunaridad(valor) { 
	material_banqueta.lacunaridad = valor; 
	UpdateTextInput(13,material_banqueta.lacunaridad);
 }

function ganancia(valor) {
	material_banqueta.ganancia = valor; 
	UpdateTextInput(14,material_banqueta.ganancia);
}

function octavas(valor) {
	material_banqueta.octavas = valor; 
	UpdateTextInput(15,material_banqueta.octavas);
   }

function resolucion(valor, coordenada) {
	material_banqueta.resolucion[coordenada] = valor;
	if (coordenada==0)
		UpdateTextInput(16,material_banqueta.resolucion[coordenada]);
	else
		UpdateTextInput(17,material_banqueta.resolucion[coordenada]);
   }

//--------------------------------------------------------------------------

function SwapInterfaz() {
    css_Canvas = document.getElementById("Canvas");
    css_WebglCanvas = document.getElementById("webglCanvas");
	css_Titulo = document.getElementById("Titulo");
	
	if (mostrar_interfaz==true){
		document.getElementById("PanelPrincipal").hidden = mostrar_interfaz;
		css_Canvas.style.setProperty('margin-left', 250 + "px");
		css_Canvas.style.setProperty('width', 1055 + "px");
		css_WebglCanvas.style.setProperty('width', 1050 + "px");
		css_Titulo.style.setProperty('padding-left' , 120 + "px");
		mostrar_interfaz=false;
	}
	else{
		document.getElementById("PanelPrincipal").hidden = mostrar_interfaz;
		css_WebglCanvas.style.setProperty('width', 1000 + "px");
		css_WebglCanvas.style.setProperty('height', 700 + "px");
		css_Canvas.style.setProperty('width', 1005 + "px");
		css_Canvas.style.setProperty('height', 750 + "px");
		css_Canvas.style.setProperty('border-radius', 25 + "px" );
		css_Canvas.style.setProperty('border', 3 + "px"+"solid"+"#ce6401"  );
		css_Titulo.style.setProperty('padding-left' , 50+ "px");	
		css_Canvas.style.setProperty('margin-left', 0 + "px");
		mostrar_interfaz=true;
	}
}

// Pantalla completa
function FullScreen(element) {
	if(!fullscreen){ 
		if(element.requestFullScreen) 
			element.requestFullScreen();
		else 
			if(element.mozRequestFullScreen)
				element.mozRequestFullScreen();
			else 
				if(element.webkitRequestFullScreen) 
					element.webkitRequestFullScreen();
	fullscreen=true; 
	}
	else{ 
		if(document.cancelFullScreen) 
			document.cancelFullScreen();
		else 
			if(document.mozCancelFullScreen) 
				document.mozCancelFullScreen();
			else 
				if(document.webkitCancelFullScreen) 
					document.webkitCancelFullScreen();		
	fullscreen=false; 
	}
}

//------------------------- PICKING--------------------------------------------
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
				document.getElementById("boton_vela").hidden=true;
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
	
	// Lienzo
	const lienzoboundingbox = new BoundingBox (lienzo);

	const slienzo = {
		'name': 'Lienzo', 
		'boundingBox' : lienzoboundingbox,
		'geometryData': lienzo,
		'modelMatrix': lienzo.matriz
	}

	//Lista de objetos que podemos seleccionar
	let list_objects = [scalavera,svela, sllama,sfarol,sbanqueta,sreloj_madera,slienzo];
	//-----------------------------------------------------------------------------------

	return list_objects;

}
function PickingObjects(pickedObject) {
	switch(pickedObject.name) {
		case ('Vela'):
			document.getElementById("luz_seleccionada").value = 0;
			document.getElementById("boton_vela").hidden=false;
			cambiar_luz(0);
			Disable_AllTextures();
			break;	
		case ('Llama'):
			document.getElementById("luz_seleccionada").value = 0;
			document.getElementById("boton_vela").hidden=false;
			cambiar_luz(0);
			Disable_AllTextures();
			break;	
		case ('Farol'):
			document.getElementById("luz_seleccionada").value = 1;
			document.getElementById("boton_vela").hidden=true;
			cambiar_luz(1);
			Disable_AllTextures();
			break;
		case ('Banqueta'):	
			Disable_Luces_TexturasNormalMapping();
			break;
		case ('Reloj'):
			Disable_Luces_TexturasNormalMapping();
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
		document.getElementById("Lienzo").hidden = ocultar;
	}
	else {
		document.getElementById("Luces").hidden = !ocultar;
		document.getElementById("TexturasNormalMapping").hidden = ocultar;
		document.getElementById("TexturaProcedural").hidden = ocultar;
		document.getElementById("Lienzo").hidden = ocultar;
		SwapInterfaz();
		mostrar_interfaz=true;
	}
}

function Disable_Luces_TexturasNormalMapping() {
	ocultar = true;
	if (mostrar_interfaz) {
		document.getElementById("boton_vela").hidden=ocultar;
		document.getElementById("TexturaProcedural").hidden =!ocultar;
		document.getElementById("TexturasNormalMapping").hidden = ocultar;
		document.getElementById("Luces").hidden = ocultar;
		document.getElementById("Lienzo").hidden = ocultar;
	}
	else {
		document.getElementById("boton_vela").hidden=ocultar;
		document.getElementById("TexturaProcedural").hidden = !ocultar;
		document.getElementById("TexturasNormalMapping").hidden = ocultar;
		document.getElementById("Luces").hidden = ocultar;
		document.getElementById("Lienzo").hidden = ocultar;
		SwapInterfaz();
		mostrar_interfaz=true;
	}
}
	
function Disable_Luces_TexturaProcedural() {
	ocultar = true;
	if (mostrar_interfaz) {
		document.getElementById("boton_vela").hidden=ocultar;
		document.getElementById("TexturasNormalMapping").hidden = !ocultar;
		document.getElementById("TexturaProcedural").hidden = ocultar;
		document.getElementById("Luces").hidden = ocultar;
		document.getElementById("Lienzo").hidden = !ocultar;
	}
	else {
		document.getElementById("boton_vela").hidden=ocultar;
		document.getElementById("TexturasNormalMapping").hidden = !ocultar;
		document.getElementById("TexturaProcedural").hidden = ocultar;
		document.getElementById("Luces").hidden = ocultar;
		document.getElementById("Lienzo").hidden = !ocultar;
		SwapInterfaz();
		mostrar_interfaz=true;
	
	
	}
}




