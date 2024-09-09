struct OurVertexShaderOutput {
    @builtin(position) position: vec4f,
    @location(0) fragUV: vec2f,
    @location(1) fragCoord: vec2f,
};

@group(0) @binding(0) var<uniform> uStyle: i32;
@group(0) @binding(1) var<uniform> uResolution: vec2<f32>;
@group(0) @binding(2) var<uniform> uSeed: f32;
@group(0) @binding(3) var<uniform> gridSize: f32;
@group(0) @binding(4) var<uniform> uIntensity: f32;
@group(0) @binding(5) var<uniform> uTime: f32;
@group(0) @binding(6) var<uniform> uSpeed: f32;
@group(0) @binding(7) var<uniform> uFractals: f32;
@group(0) @binding(8) var<uniform> uPosCol: vec3<f32>;
@group(0) @binding(9) var<uniform> uNegCol: vec3<f32>;

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
    vsOutput.fragCoord = vsOutput.fragUV * uResolution;

    return vsOutput;
}

fn vec3Equals(a: vec3<f32>, b: vec3<f32>) -> bool {
    var boolVec = a == b;
    if(boolVec.x == false || boolVec.y == false || boolVec.z == false) {
        return false;
    }
    return true;
}

fn randomGradient(corner: vec2<f32>) -> vec2<f32> {
        var x = dot(corner, vec2(1.9, 1.2));
        var y = dot(corner, vec2(2.3, 1.3));
        var gradient = vec2(x,y);
        gradient = sin(gradient);
        gradient = gradient * uSeed + uTime*0.3*uSpeed;
        gradient = sin(gradient);
        return gradient;
}

fn quintic(p: vec2<f32>) -> vec2<f32> {
    return p * p * p * (10.0 + p * (-15.0 + p * 6.0));
}

@fragment fn fragMain(fsInput: OurVertexShaderOutput) -> @location(0) vec4f {
    var uv = (fsInput.fragCoord - uResolution.xy * 0.5) / min(uResolution.x, uResolution.y);
    uv += vec2(uSeed*0.13, uSeed*0.23);

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

    if(uStyle == 1) {
        color = fract(color * uFractals);
    }

    else if(uStyle == 2) {
        color = (color + 0.6) / 2.0;
    }

    else if(uStyle == 3) {
        color = abs(color);
    }

    var resCol = mix(uNegCol, uPosCol, color);
    resCol *= pow(color*uIntensity, uIntensity);

    return vec4(resCol, 1.0);
}