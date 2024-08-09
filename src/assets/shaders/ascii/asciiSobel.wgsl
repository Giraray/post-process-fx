struct VertexShaderOutput {
    @builtin(position) position: vec4f,
    @location(0) fragUV: vec2f,
    @location(1) fragCoord: vec2f,
};

@vertex fn vertexMain(
    @builtin(vertex_index) vertexIndex : u32
) -> VertexShaderOutput {
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

    var vsOutput: VertexShaderOutput;
    let xy = pos[vertexIndex];
    vsOutput.position = vec4f(xy, 0.0, 1.0);

    vsOutput.fragUV = (xy + 1) / 2; // convert clip-space (-1 - 1) to UV (0 - 1)
    vsOutput.fragCoord = vsOutput.fragUV * uResolution;

    return vsOutput;
}

@group(0) @binding(0) var uSampler: sampler;
@group(0) @binding(1) var uTexture: texture_2d<f32>;
@group(0) @binding(2) var<uniform> uResolution: vec2<f32>;
@group(0) @binding(3) var<uniform> uTime: f32;

fn getFragLuma(offsetUV: vec2<f32>) -> f32 {
    var targetColor = textureSample(uTexture, uSampler, offsetUV);
    var fragLuma = targetColor.r * 0.2126 + targetColor.g * 0.7152 + targetColor.b * 0.0722;
    return fragLuma;
}

@fragment fn fragMain(fsInput: VertexShaderOutput) -> @location(0) vec4f {
    var uv = fsInput.fragUV;
    //
    // 3. sobel gradients
    var stepx = 1.0 / uResolution.x;
    var stepy = 1.0 / uResolution.y;

    var kernel1 = 1.0;
    var kernel2 = 2.0; // ?

    var horizontalSobelMatrix = array<f32, 9>(
        -kernel1, 0.0, kernel1,
        -kernel2, 0.0, kernel2,
        -kernel1, 0.0, kernel1
    );

    var verticalSobelMatrix = array<f32, 9>(
        kernel1, kernel2, kernel1,
        0.0, 0.0, 0.0,
        -kernel1, -kernel2, -kernel1
    );

    // TODO make this fancy like the kernel calculator
    var offsets = array<vec2<f32>, 9>(
        vec2(uv.x - stepx, uv.y + stepy), // 1
        vec2(uv.x, uv.y + stepy),
        vec2(uv.x + stepx, uv.y + stepy), // 3
        vec2(uv.x - stepx, uv.y),
        vec2(uv.x, uv.y), // 5
        vec2(uv.x, uv.y),
        vec2(uv.x - stepx, uv.y - stepy), // 7
        vec2(uv.x, uv.y - stepy),
        vec2(uv.x + stepx, uv.y - stepy) // 9
    );

    var gx = 0.0;
    gx += horizontalSobelMatrix[0] * getFragLuma(offsets[0]);
    gx += horizontalSobelMatrix[1] * getFragLuma(offsets[1]);
    gx += horizontalSobelMatrix[2] * getFragLuma(offsets[2]);
    gx += horizontalSobelMatrix[3] * getFragLuma(offsets[3]);
    gx += horizontalSobelMatrix[4] * getFragLuma(offsets[4]);
    gx += horizontalSobelMatrix[5] * getFragLuma(offsets[5]);
    gx += horizontalSobelMatrix[6] * getFragLuma(offsets[6]);
    gx += horizontalSobelMatrix[7] * getFragLuma(offsets[7]);
    gx += horizontalSobelMatrix[8] * getFragLuma(offsets[8]);


    var gy = 0.0;
    gy += verticalSobelMatrix[0] * getFragLuma(offsets[0]);
    gy += verticalSobelMatrix[1] * getFragLuma(offsets[1]);
    gy += verticalSobelMatrix[2] * getFragLuma(offsets[2]);
    gy += verticalSobelMatrix[3] * getFragLuma(offsets[3]);
    gy += verticalSobelMatrix[4] * getFragLuma(offsets[4]);
    gy += verticalSobelMatrix[5] * getFragLuma(offsets[5]);
    gy += verticalSobelMatrix[6] * getFragLuma(offsets[6]);
    gy += verticalSobelMatrix[7] * getFragLuma(offsets[7]);
    gy += verticalSobelMatrix[8] * getFragLuma(offsets[8]);

    var g = sqrt((pow(gx,2.0) + pow(gy,2.0))); // ?????????????? <--- aggregates all sides

    return vec4(g,g,g,1.0);
}