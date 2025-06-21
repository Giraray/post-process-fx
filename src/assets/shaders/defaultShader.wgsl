struct OurVertexShaderOutput {
    @builtin(position) position: vec4f,
    @location(0) fragUV: vec2f,
};

@vertex fn vertexMain(
    @builtin(vertex_index) vertexIndex : u32
) -> OurVertexShaderOutput {
    let pos = array(

        vec2f( -1.0,  -1.0),  // bottom right
        vec2f( -1.0, 1.0),  // top right
        vec2f( 1.0,  -1.0),  // bottom right

        vec2f( 1.0,  1.0),  // top right
        vec2f( -1.0,  1.0),  // top left
        vec2f( 1.0,  -1.0),  // bottom right
    );

    var vsOutput: OurVertexShaderOutput;
    let xy = pos[vertexIndex];
    vsOutput.position = vec4f(xy.x, -xy.y, 0.0, 1.0);

    vsOutput.fragUV = (xy + 1) / 2; // convert clip-space (-1 - 1) to UV (0 - 1)

    return vsOutput;
}

@group(0) @binding(0) var ourSampler: sampler;
@group(0) @binding(1) var ourTexture: texture_2d<f32>;
@group(0) @binding(2) var<uniform> uContrast: f32;
@group(0) @binding(3) var<uniform> uBrightness: f32;

@fragment fn fragMain(fsInput: OurVertexShaderOutput) -> @location(0) vec4f {
    var tex = textureSample(ourTexture, ourSampler, fsInput.fragUV);

    tex.r = mix(0.5, tex.r + uBrightness - 1.0, uContrast);
    tex.g = mix(0.5, tex.g + uBrightness - 1.0, uContrast);
    tex.b = mix(0.5, tex.b + uBrightness - 1.0, uContrast);
    tex.r = clamp(0.0, 1.0, tex.r);
    tex.g = clamp(0.0, 1.0, tex.g);
    tex.b = clamp(0.0, 1.0, tex.b);

    return tex;
}