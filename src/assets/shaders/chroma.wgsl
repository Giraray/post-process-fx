struct OurVertexShaderOutput {
    @builtin(position) position: vec4f,
    @location(0) fragUV: vec2f,
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

    return vsOutput;
}

@group(0) @binding(0) var ourSampler: sampler;
@group(0) @binding(1) var ourTexture: texture_2d<f32>;

const chromaSpread : f32 = 4.0;
const chromaIntensity : f32 = 1.0;

@fragment fn fragMain(fsInput: OurVertexShaderOutput) -> @location(0) vec4f {
    var color = textureSample(ourTexture, ourSampler, fsInput.fragUV);

    var center = vec2(0.5);

    var multiplier = chromaSpread / sqrt(pow(center.x, 2.0) + pow(center.y, 2.0));

    var frag = abs(center - fsInput.fragUV);
    var distanceFromCenter = sqrt(pow(frag.x, 2.0) + pow(frag.y, 2.0));

    var adjustedAmount = 0.02 * chromaIntensity * (distanceFromCenter * multiplier);

    color.r = textureSample(ourTexture, ourSampler, vec2(fsInput.fragUV.x + adjustedAmount, fsInput.fragUV.y)).r;
    color.g = textureSample(ourTexture, ourSampler, fsInput.fragUV).g;
    color.b = textureSample(ourTexture, ourSampler, vec2(fsInput.fragUV.x - adjustedAmount, fsInput.fragUV.y)).b;

    return color;
}