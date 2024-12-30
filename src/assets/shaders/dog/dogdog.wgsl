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
    vsOutput.position = vec4f(xy.x, -xy.y, 0.0, 1.0);

    vsOutput.fragUV = (xy + 1) / 2; // convert clip-space (-1 - 1) to UV (0 - 1)
    vsOutput.fragCoord = vsOutput.fragUV * uResolution;

    return vsOutput;
}

@group(0) @binding(0) var uSampler: sampler;
@group(0) @binding(1) var uTexture: texture_2d<f32>;
@group(0) @binding(2) var<uniform> uResolution: vec2<f32>;
@group(0) @binding(3) var<uniform> uTime: f32;

const MATRIX_SIZE : i32 = 11;
const KERNEL_SIZE : i32 = (MATRIX_SIZE - 1)/2;

const PI : f32 = 3.141592653589793238;
const radialDiv : f32 = 1.0/16.0;

// normalized probability density function
fn normPdf(x: f32, sigma: f32) -> f32 {
    return 0.39894 * exp(-0.5 * x * x / (sigma*sigma)) / sigma;
}

fn blur(fragCoord: vec2<f32>, sigma: f32) -> vec3<f32> {
    var kSize = KERNEL_SIZE;
    var kernel = array<f32, MATRIX_SIZE>();

    // calculate kernel density
    for(var i = 0; i <= kSize; i++) {
        kernel[kSize + i] = normPdf(f32(i), sigma);
        kernel[kSize - i] = normPdf(f32(i), sigma);
    }

    // calculate sum of kernel
    var sum = 0.0;
    for(var i = 0; i < MATRIX_SIZE; i++) {
        sum += kernel[i];
    }

    // apply gaussian blur
    var blur = vec3(0.0);
    for(var i = -kSize; i <= kSize; i++) {
        for(var j = -kSize; j <= kSize; j++) {
            var texel = textureSample(uTexture, uSampler, (fragCoord + vec2(f32(i), f32(j))) / uResolution);

            // apply contrast + brightness
            // texel.r = mix(0.5, texel.r + uBrightness - 1.0, uContrast);
            // texel.g = mix(0.5, texel.g + uBrightness - 1.0, uContrast);
            // texel.b = mix(0.5, texel.b + uBrightness - 1.0, uContrast);

            // texel.r = clamp(0.0, 1.0, texel.r);
            // texel.g = clamp(0.0, 1.0, texel.g);
            // texel.b = clamp(0.0, 1.0, texel.b);

            blur += kernel[kSize + j] * kernel[kSize + i] * texel.rgb;
        }
    }

    return blur / (sum*sum);
}

@fragment fn fragMain(fsInput: VertexShaderOutput) -> @location(0) vec4f {
    var uv = fsInput.fragUV;
    var fragCoord = fsInput.fragCoord;
    var sTensor = textureSample(uTexture, uSampler, uv);

    var sigma = 0.000001;

    var blur = blur(fragCoord, sigma);

    var eValues = vec2(0.0); // eigenvalues
    eValues.x = (blur.x + blur.z + sqrt(pow(blur.x - blur.z, 2) + 4 * pow(blur.y, 2))) / 2.0;
    eValues.y = (blur.x + blur.z - sqrt(pow(blur.x - blur.z, 2) + 4 * pow(blur.y, 2))) / 2.0;

    // eigenvector
    var eVector = vec2(eValues.x - blur.x, -blur.y);
    // eVector = 1.0 - eVector;
    eVector.r = 1.0 - eVector.r;
    // eVector.g = abs(eVector.g) * 1.0;

    var tex = textureSample(uTexture, uSampler, uv);

    tex.r += 0.5;
    return tex;
    // return vec4(blur, 1.0);
}