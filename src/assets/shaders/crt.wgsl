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
    vsOutput.position = vec4f(xy, 0.0, 1.0);

    vsOutput.fragUV = (xy + 1) / 2; // convert clip-space (-1 - 1) to UV (0 - 1)
    vsOutput.fragCoord = vsOutput.fragUV * resolution;

    return vsOutput;
}

@group(0) @binding(0) var ourSampler: sampler;
@group(0) @binding(1) var ourTexture: texture_2d<f32>;
@group(0) @binding(2) var<uniform> resolution: vec2<f32>;

const SCAN_BRIGHTNESS = 0.35;
const MOIRE_OPACITY = 0.9;
const CRT_OPACITY = 0.3;
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

@fragment fn fragMain(fsInput: OurVertexShaderOutput) -> @location(0) vec4f {
    var uv = fsInput.fragUV;
    uv = curveUV(uv);

    var distortSpeed = iTime * 1.0;
    
    // x = complex sinusoid; multiplication of multiple sine waves
    float x = sin(0.3*distortSpeed+uv.y*10.0) * sin(0.7*distortSpeed+uv.y*13.0) * sin(0.63*distortSpeed+uv.y*16.0)*0.001;

    var color = textureSample(ourTexture, ourSampler, uv);

    return color;
}