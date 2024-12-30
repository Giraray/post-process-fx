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
@group(0) @binding(3) var<uniform> uBlur: f32;
@group(0) @binding(4) var<uniform> uDog: f32;
@group(0) @binding(5) var<uniform> uThresh: f32;
@group(0) @binding(6) var<uniform> uScaler: f32;
@group(0) @binding(7) var<uniform> uTau: f32;
@group(0) @binding(8) var<uniform> uQuantize: f32;
@group(0) @binding(9) var<uniform> uStyle: f32;

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

// oklab stuff
const invB = mat3x3<f32>(
    vec3(0.4121656120, 0.2118591070, 0.0883097947),
    vec3(0.5362752080, 0.6807189584, 0.2818474174),
    vec3(0.0514575653, 0.1074065790, 0.6302613616)
);

const invA = mat3x3<f32>(
    vec3(0.2104542553, 1.9779984951, 0.0259040371),
    vec3(0.7936177850, -2.4285922050, 0.7827717662),
    vec3(-0.0040720468, 0.4505937099, -0.8086757660)
);

// https://www.shadertoy.com/view/WtccD7
fn sRGBtoOKLAB(color: vec3<f32>) -> vec3<f32> {
    var lms = invB * color;
    return invA * (sign(lms) * pow(abs(lms), vec3(0.333333333)));
}

fn desaturate(color: vec3<f32>) -> vec3<f32> {
    var lum = vec3(0.299, 0.587, 0.114);
    var gray = vec3(dot(lum, color));
    return vec3(gray);
}

// normalized probability density function
fn normPdf(x: f32, sigma: f32) -> f32 {
    return 0.39894 * exp(-0.5 * x * x / (sigma*sigma)) / sigma;
}

fn colorQuantize(texel: vec3<f32>, n: f32) -> vec3<f32> {
    var colVal = clamp(texel.r, 0.0, 1.0);
    var color = floor(colVal * (uQuantize)) / (uQuantize - 1.0);
    return vec3(color);
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

            if(uStyle == 0.0) { // quantized
                texel = vec4(colorQuantize(desaturate(texel.rgb), uQuantize), 1.0);
            }

            blur += kernel[kSize + j] * kernel[kSize + i] * texel.rgb;
        }
    }

    return blur / (sum*sum);
}

@fragment fn fragMain(fsInput: VertexShaderOutput) -> @location(0) vec4f {
    var uv = fsInput.fragUV;
    var fragCoord = fsInput.fragCoord.xy;

    var weak = desaturate(blur(fragCoord, uBlur));
    var strong = desaturate(blur(fragCoord, uBlur * uDog));

    var dog = (1.0 + uTau) * weak - uTau * strong;

    var colVal = clamp(dog.r, 0.0, 1.0);
    if(uStyle == 0.0) { // quantized
        var value = floor(colVal * (uQuantize)) / (uQuantize - 1.0);
        dog = vec3(value);
    }
    else if(uStyle == 1.0) { // hyperbolic
        if(colVal >= uThresh) {
            dog = vec3(1.0);
        }
        else {
            var value = tanh(uScaler * (colVal*10.0 - uThresh));
            dog = vec3(value);
        }
    }

    var result = dog;

    var color = textureSample(uTexture, uSampler, uv);
    var vall = dot(color.rgb, vec3(0.71, 0.21, 0.07));
    var colorS = vec3(vec3(vall));

    return vec4(result, 1.0);
}