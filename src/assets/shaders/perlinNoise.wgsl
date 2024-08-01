struct OurVertexShaderOutput {
    @builtin(position) position: vec4f,
    @location(0) fragUV: vec2f,
    @location(1) fragCoord: vec2f,
};

@group(0) @binding(0) var<uniform> style: i32;
@group(0) @binding(1) var<uniform> resolution: vec2<f32>;
@group(0) @binding(2) var<uniform> seed: f32;
@group(0) @binding(3) var<uniform> gridSize: f32;
@group(0) @binding(4) var<uniform> intensity: f32;
@group(0) @binding(5) var<uniform> time: f32;

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

fn randomGradient(corner: vec2<f32>) -> vec2<f32> {
        var x = dot(corner, vec2(1.9, 1.5));
        var y = dot(corner, vec2(2.3, 1.3));
        var gradient = vec2(x,y);
        gradient = sin(gradient);
        gradient *= seed + time*0.03;
        gradient = sin(gradient);
        return gradient;
}

fn quintic(p: vec2<f32>) -> vec2<f32> {
    return p * p * p * (10.0 + p * (-15.0 + p * 6.0));
}

@fragment fn fragMain(fsInput: OurVertexShaderOutput) -> @location(0) vec4f {
    // var color = textureSample(ourTexture, ourSampler, fsInput.fragUV) + 0.2;  // remove

    var uv = (fsInput.fragCoord - resolution.xy * 0.5) / min(resolution.x, resolution.y);
    uv += vec2(seed*0.13, seed*0.13);

    uv *= gridSize;
    
    var gridId = floor(uv);
    var gridUv = fract(uv);

    // find corners
    var tl = gridId;
    var tr = gridId + vec2(1,0);
    var bl = gridId + vec2(0,1);
    var br = gridId + vec2(1,1);

    // generate perlin vectors
    var gradTl = randomGradient(tl);
    var gradTr = randomGradient(tr);
    var gradBl = randomGradient(bl);
    var gradBr = randomGradient(br);

    // find distance from fragUV to each corner
    var fragToTl = gridUv;
    var fragToTr = gridUv - vec2(1.0, 0.0);
    var fragToBl = gridUv - vec2(0.0, 1.0);
    var fragToBr = gridUv - vec2(1.0, 1.0);

    // calculate dot product of gradient + distance
    var dotTl = dot(gradTl, fragToTl);
    var dotTr = dot(gradTr, fragToTr);
    var dotBl = dot(gradBl, fragToBl);
    var dotBr = dot(gradBr, fragToBr);

    // polynomial interpolation; makes it more organic
    gridUv = quintic(gridUv);

    // linear interpolation between the 4 dot products
    var t = mix(dotTl, dotTr, gridUv.x);
    var b = mix(dotBl, dotBr, gridUv.x);
    var color = mix(t, b, gridUv.y);

    if(style == 1) {
        color = abs(color);
    }
    else if(style == 2) {
        color = (color + 0.6) / 2.0;
    }

    color = pow(color*intensity, intensity);

    return vec4(vec3(color), 1.0);
}