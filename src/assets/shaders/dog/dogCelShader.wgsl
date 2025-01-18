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
@group(0) @binding(5) var<uniform> uTau: f32;
@group(0) @binding(6) var<uniform> uQuantize: f32;
@group(0) @binding(7) var<uniform> uSeed: vec4<f32>;
@group(0) @binding(8) var<uniform> uHarmony: f32; // 0 = analogous, 1 = equidistant, 2 = monochromatic, 3 = complementary

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

// color stuff
const kCONEtoLMS = mat3x3<f32>(
    vec3(0.4121656120, 0.2118591070, 0.0883097947),
    vec3(0.5362752080, 0.6807189584, 0.2818474174),
    vec3(0.0514575653, 0.1074065790, 0.6302613616)
);

const kLMStoCONE = mat3x3<f32>(
    vec3(4.0767245293, -1.2681437731, -0.0041119885),
    vec3(-3.3072168827,  2.6093323231, -0.7034763098),
    vec3(0.2307590544, -0.3411344290,  1.7068625689)
);

// https://www.shadertoy.com/view/WtccD7
// fn sRGBtoOKLAB(color: vec3<f32>) -> vec3<f32> {
//     var lms = invB * color;
//     return invA * (sign(lms) * pow(abs(lms), vec3(0.333333333)));
// }

fn hueToRgb(p: f32, q: f32, t: f32) -> f32 {
    var valT = t;
    if(valT < 0) {valT += 1.0;}
    if(valT > 1.0) {valT -= 1.0;}
    if(valT < 1.0/6.0) {return p + (q - p) * 6.0 * valT;}
    if(valT < 0.5) {return q;}
    if(valT < 2.0/3.0) {return p + (q - p) * (2.0/3.0 - valT) * 6.0;}
    return p;
}

fn hslToRgb(hsl: vec3<f32>) -> vec3<f32> {
    var h = hsl.x;
    var s = hsl.y;
    var l = hsl.z;
    var rgb = vec3(0.0);
    if(s == 0.0) {
        rgb = vec3(0.0);
    }
    else {
        var q = 0.0;
        if(l < 0.5) {
            q = l * (1.0 + s);
        }
        else {
            q = l + s - l * s;
        }
        var p = 2.0 * l - q;
        rgb.r = hueToRgb(p, q, h + 1.0/3.0);
        rgb.g = hueToRgb(p, q, h);
        rgb.b = hueToRgb(p, q, h - 1.0/3.0);
    }
    return rgb;
}

fn asd(colA: vec3<f32>, colB: vec3<f32>, h: f32) -> vec3<f32> {
    var lmsA = pow(kCONEtoLMS * colA, vec3(1.0/3.0));
    var lmsB = pow(kCONEtoLMS * colB, vec3(1.0/3.0));
    var lms = mix(lmsA, lmsB, h);
    return kLMStoCONE * (lms*lms*lms);
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

            texel = vec4(colorQuantize(desaturate(texel.rgb), uQuantize), 1.0);

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

    // redundant?
    var value = floor(dog.r * (uQuantize)) / (uQuantize - 1.0);
    dog = vec3(value);


    var h = uSeed.x;
    var l = uSeed.y;

    if(l > 0.7) { // todo: make it consistently dark
        l *= (l - 0.15);
    }

    var s = uSeed.w;
    var rh = uSeed.z * 0.5;
    if(h + rh * (uQuantize - 1.0) > 1.0 + h) {
        rh *= 1.0 / (rh * uQuantize);
    }

    var rl = uSeed.w;
    if(l + rl * (uQuantize - 1.0) > 1.0) {
        rl *= (1.0 - l) / (rl * uQuantize);
    }

    var baseColor = vec3(h,s,l);
    var mult = clamp(dog.r, 0.0, 1.0) * (uQuantize - 1.0);

    baseColor.x += rh * mult;
    if(baseColor.x > 1.0) { // clamp hue into range if outside
        baseColor.x = baseColor.x - 1.0;
    }

    baseColor.z += rl * mult;
    baseColor = hslToRgb(baseColor);

    var harmony = uHarmony;

    // var col2 = vec3(1.0, 0.0, 0.0);

    // col1 = pow(col1, vec3(2.2));
    // col2 = pow(col2, vec3(2.2));

    // var mixCol = vec3(0.0);
    // if(uv.x < 0.49) {
    //     mixCol = mix(col1, col2, uv.y);
    // }
    // else if(uv.x > 0.51) {
    //     mixCol = asd(col1, col2, uv.y);
    // }

    // mixCol = pow(mixCol, vec3(1.0/2.2));

    return vec4(baseColor, 1.0);
}