#define SHADER_NAME rtt-double-buffered/demo_fill.frag

precision mediump float;
uniform vec2 resolution;
varying vec2 uv;

#pragma glslify: snoise2 = require(glsl-noise/simplex/2d) 

const int MANY_HARMONICS = 8;
float snoise_harmonic(vec2 p){
	float result = 0.;
	for(int i =0; i < MANY_HARMONICS; ++i){
		result += pow(.5, float(i)) * snoise2(p * (resolution / min(resolution.x, resolution.y)) * pow(2., float(i)));
	}
	return result;
}
void main() {
	gl_FragColor = vec4(snoise_harmonic(uv), 0., 0., 1.);// * (1. / 1600.));
}