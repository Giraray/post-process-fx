struct VertexShaderOutput {
    @builtin(position) position: vec4f,
    @location(0) fragUV: vec2f,
    @location(1) fragCoord: vec2f,
};

@vertex fn vertexMain(
    @builtin(vertex_index) vertexIndex : u32
) -> VertexShaderOutput {
    let pos = array(

        vec2f( -1.0,  -1.0),  // bottom right
        vec2f( -1.0,  1.0),  // top right
        vec2f( 1.0,  -1.0),  // bottom right

        vec2f( 1.0,  1.0),  // top right
        vec2f( -1.0,  1.0),  // top left
        vec2f( 1.0,  -1.0),  // bottom right
    );

    var vsOutput: VertexShaderOutput;
    let xy = pos[vertexIndex];
    vsOutput.position = vec4f(xy.x, -xy.y, 0.0, 1.0);

    vsOutput.fragUV = (xy + 1) / 2; // convert clip-space (-1 - 1) to UV (0 - 1)
    vsOutput.fragCoord = vsOutput.fragUV * uResolution;

    return vsOutput;
}

@group(0) @binding(0) var uSampler: sampler;
@group(0) @binding(1) var uTexture: texture_2d<f32>;
@group(0) @binding(2) var<uniform> uResolution: vec2<f32>;
@group(0) @binding(3) var<uniform> uAAStrength: f32;

const PI : f32 = 3.141592653589793238;
const radialDiv : f32 = 1.0/16.0;

const kernel1 = 1.0;
const kernel2 = 2.0; // ?
const horizontalSobelMatrix = array<f32, 9>(
    -kernel1, 0.0, kernel1,
    -kernel2, 0.0, kernel2,
    -kernel1, 0.0, kernel1
);
const verticalSobelMatrix = array<f32, 9>(
    kernel1, kernel2, kernel1,
    0.0, 0.0, 0.0,
    -kernel1, -kernel2, -kernel1
);

const MATRIX_SIZE : i32 = 11;
const KERNEL_SIZE : i32 = (MATRIX_SIZE - 1)/2;

fn desaturate(color: vec4<f32>) -> f32 {
    var lum = vec3(0.299, 0.587, 0.114);
    var gray = dot(lum, color.rgb);
    return gray;
}

fn detectEdge(uv: vec2<f32>) -> vec2<f32> {
    var mid = textureSample(uTexture, uSampler, uv);

    var step = vec2(uAAStrength / uResolution);
    var x = step.x;
    var y = step.y;

    var n = desaturate(textureSample(uTexture, uSampler, uv + vec2(0.0, -y)));
    var e = desaturate(textureSample(uTexture, uSampler, uv + vec2(x, 0.0)));
    var s = desaturate(textureSample(uTexture, uSampler, uv + vec2(0.0, y)));
    var w = desaturate(textureSample(uTexture, uSampler, uv + vec2(-x, 0.0)));

    var edgeStrength = vec2(abs(n - s), abs(e - w));

    return edgeStrength;
}

fn boxBlur(uv: vec2<f32>) -> vec3<f32> {
    var step = vec2(uAAStrength / uResolution);
    var x = step.x;
    var y = step.y;

    var c = textureSample(uTexture, uSampler, uv);
    var n = textureSample(uTexture, uSampler, uv + vec2(0.0, -y));
    var e = textureSample(uTexture, uSampler, uv + vec2(x, 0.0));
    var s = textureSample(uTexture, uSampler, uv + vec2(0.0, y));
    var w = textureSample(uTexture, uSampler, uv + vec2(-x, 0.0));

    c = (c + n + e + s + w) * 0.2;

    return c.rgb;
}

@fragment fn fragMain(fsInput: VertexShaderOutput) -> @location(0) vec4f {
    var uv = fsInput.fragUV;
    var fragCoord = fsInput.fragCoord;

    var r = detectEdge(uv);
    var t = 0.001;
    if(r.x < t) {r.x = 0.0;}
    if(r.y < t) {r.y = 0.0;}

    var blur = boxBlur(uv);

    return vec4(blur, 1.0);
}