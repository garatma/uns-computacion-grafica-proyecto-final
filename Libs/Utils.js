class Utils {
	static cartesianas_a_esfericas(cartesianas) {
		let x = cartesianas[0], y = cartesianas[1], z = cartesianas[2];
		let r,f,t;
		r = Math.sqrt(x*x + y*y + z*z);
		t = Math.atan2(x,z);
		if ( t < 0 ) t += 2*Math.PI;
		f = Math.acos(y/r);
		return [r,t,f];
	}

	static esfericas_a_cartesianas(esfericas) {
		let r = esfericas[0], t = esfericas[1], f = esfericas[2];
		let x,y,z;
		x = r * Math.sin(f) * Math.sin(t);
		y = r * Math.cos(f);
		z = r * Math.sin(f) * Math.cos(t);
		return [x,y,z];
	}

	static toRadian(degrees) { return degrees * Math.PI / 180 }

	static random(min,max) { return Math.floor(Math.random()*(max-min+1)+min); }
}
