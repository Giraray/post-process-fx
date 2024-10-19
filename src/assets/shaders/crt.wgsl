struct OurVertexShaderOutput {
    @builtin(position) position: vec4f,
    @location(0) fragUV: vec2f,
    @location(1) fragCoord: vec2f,
};

@vertex fn vertexMain(
    @builtin(vertex_index) vertexIndex : u32
) -> OurVertexShaderOutput {
    let pos = array(

        // mf QUAD!!!!
        // 1st triangle
        vec2f( -1.0,  -1.0),  // bottom right
        vec2f( -1.0,  1.0),  // top right
        vec2f( 1.0,  -1.0),  // bottom right

        // 2st triangle
        vec2f( 1.0,  1.0),  // top right
        vec2f( -1.0,  1.0),  // top left
        vec2f( 1.0,  -1.0),  // bottom right
    );

    var vsOutput: OurVertexShaderOutput;
    let xy = pos[vertexIndex];
    vsOutput.position = vec4f(xy.x, -xy.y, 0.0, 1.0);

    vsOutput.fragUV = (xy + 1) / 2; // convert clip-space (-1 - 1) to UV (0 - 1)
    vsOutput.fragCoord = vsOutput.fragUV * uResolution;

    return vsOutput;
}

@group(0) @binding(0) var ourSampler: sampler;
@group(0) @binding(1) var ourTexture: texture_2d<f32>;
@group(0) @binding(2) var<uniform> uResolution: vec2<f32>;
@group(0) @binding(3) var<uniform> uTime: f32;
@group(0) @binding(4) var<uniform> uDoDistortion: f32;

const SCAN_BRIGHTNESS = 0.38;
const MOIRE_OPACITY = 0.9;
const CRT_OPACITY = 0.5;
const CRT_SPREAD = 5.0;

// protrudes the UV into a convex
fn curveUV(orgUV: vec2<f32>) -> vec2<f32> {
    var uv = orgUV;
    uv = (uv - 0.5) * 2.0 * 1.02;
    uv.x *= 1.0 + pow(uv.y * 0.2, 2.0);
    uv.y *= 1.0 + pow(uv.x * 0.25, 2.0);
    uv = (uv / 2.0) + 0.5;

    return uv;
}

fn modulo(a: f32, b: f32) -> f32 {
    return a - b * floor(a / b);
}

@fragment fn fragMain(fsInput: OurVertexShaderOutput) -> @location(0) vec4f {
    var uv = fsInput.fragUV;
    uv = curveUV(uv);

    var distortSpeed = 0.0;
    if(uDoDistortion == 1.0) {
        distortSpeed = uTime * 2.0;
    }
    
    // x = complex sinusoid; multiplication of multiple sine waves
    var sinewave = sin(0.3*distortSpeed+uv.y*10.0) * sin(0.7*distortSpeed+uv.y*13.0) * sin(0.63*distortSpeed+uv.y*16.0) * 0.001;

    var color = vec3(0.0);

    // UV distortion + slight chroma
    color.r = textureSample(ourTexture,ourSampler,vec2(uv.x+0.001+sinewave,uv.y+0.001)).x+0.05;
    color.g = textureSample(ourTexture,ourSampler,vec2(uv.x+0.000+sinewave,uv.y-0.002)).y+0.05;
    color.b = textureSample(ourTexture,ourSampler,vec2(uv.x-0.002+sinewave,uv.y+0.000)).z+0.05;

    // aperture grille chroma ?
    color.r += 0.02*textureSample(ourTexture,ourSampler, vec2(sinewave + 0.01, -0.02) + vec2(uv.x + 0.001,uv.y + 0.001)).r;
    color.g += 0.02*textureSample(ourTexture,ourSampler, vec2(sinewave + -0.01, -0.02) + vec2(uv.x + 0.000,uv.y - 0.002)).g;
    color.b += 0.02*textureSample(ourTexture,ourSampler, vec2(sinewave + -0.01, -0.02) + vec2(uv.x - 0.001,uv.y + 0.001)).b;

    color = (0.6 * color) + (0.4 * color * color); // tonemapping?? idk
    color *= vec3(0.95,1.05,0.95); // highlighting the green values

    var vig = 16.0 * uv.x * uv.y * (1.0 - uv.x) * (1.0 - uv.y); // a vignette that multiplies the color (outer edges = darker)
	color *= vec3(pow(vig,0.3));

    // fill out weird ass corners
    if (uv.x < 0.0 || uv.x > 1.0) {
        color *= 0.0;
    }
	if (uv.y < 0.0 || uv.y > 1.0) {
        color *= 0.0;
    }

    // scanlines
    var scans = clamp(0.35 + SCAN_BRIGHTNESS * sin(3.5 * distortSpeed + uv.y * uResolution.y * 1.5), 0.0, 1.0); // remove clamp
    scans = pow(scans, MOIRE_OPACITY);
	color = color*vec3(0.95 + scans);

    color *= 1.0 + 0.02 * sin(110.0 * uTime); // flickering

    // aperture grille
    color *= 1.2 - CRT_OPACITY * vec3(clamp((modulo(fsInput.fragCoord.x, CRT_SPREAD)), 0.0, 1.0));

    return vec4(color, 1.0);
}