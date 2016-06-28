#define SHADER_NAME rtt-double-buffered/demo.frag

precision mediump float;
uniform sampler2D originalTexture;
uniform sampler2D backBufferTexture;
uniform vec2 pixelDim;
uniform float frameId;//random number between 0 and 1, by default
varying vec2 uv;

#pragma glslify: random = require(glsl-random) 

vec2 random_vector(){
	return normalize(vec2(
		random(uv + frameId) - .5,
		random((uv + frameId) + vec2(0.63435491855925, 0.71769328774777)) - .5
	));
}
void main() {

	vec4 v = texture2D(backBufferTexture, uv);
	vec4 orig = texture2D(originalTexture, uv);
	
	//gl_FragColor = orig;
	//return;

	vec4 ov = texture2D(backBufferTexture, uv + pixelDim*random_vector()*2.);
	vec4 result = vec4(normalize(vec3(
		.5*(v.x+ov.x)+v.y*.01, 
		.9*v.y + abs(v.x - ov.x) + .1*v.z, 
		.9*v.z + abs(v.y - ov.y)
		) + orig.xyz*.1), 
		1.);
	gl_FragColor = result;
}