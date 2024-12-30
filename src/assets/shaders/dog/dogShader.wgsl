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
        vec2f( -1.0, 1.0),  // top right
        vec2f( 1.0,  -1.0),  // bottom right

        // 2st triangle
        vec2f( 1.0,  1.0),  // top right
        vec2f( -1.0,  1.0),  // top left
        vec2f( 1.0,  -1.0),  // bottom right
    );

    var vsOutput: OurVertexShaderOutput;
    let xy = pos[vertexIndex];
    vsOutput.position = vec4f(xy.x, -xy.y, 0.0, 1.0);

    vsOutput.fragUV = (xy + 1) / 2; // convert clip-space (-1 - 1) to UV (0 - 1)
    vsOutput.fragCoord = vsOutput.fragUV * uResolution;

    return vsOutput;
}

@group(0) @binding(0) var uSampler: sampler;
@group(0) @binding(1) var uTexture: texture_2d<f32>;
@group(0) @binding(2) var<uniform> uSigmaSubtract: f32;
@group(0) @binding(3) var<uniform> uContrast: f32;
@group(0) @binding(4) var<uniform> uBrightness: f32;
@group(0) @binding(5) var<uniform> uResolution: vec2<f32>;
@group(0) @binding(6) var<uniform> uThresh: f32;
@group(0) @binding(7) var<uniform> uScaler: f32;

const MATRIX_SIZE : i32 = 11;
const KERNEL_SIZE : i32 = (MATRIX_SIZE - 1)/2;

// normalized probability density function
fn normPdf(x: f32, sigma: f32) -> f32 {
    return 0.39894 * exp(-0.5 * x * x / (sigma*sigma)) / sigma;
}

fn desaturate(color: vec3<f32>) -> vec4<f32> {
    var lum = vec3(0.299, 0.587, 0.114);
    var gray = vec3(dot(lum, color));
    return vec4(mix(color, gray, 1), 1);
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
            texel.r = mix(0.5, texel.r + uBrightness - 1.0, uContrast);
            texel.g = mix(0.5, texel.g + uBrightness - 1.0, uContrast);
            texel.b = mix(0.5, texel.b + uBrightness - 1.0, uContrast);

            texel.r = clamp(0.0, 1.0, texel.r);
            texel.g = clamp(0.0, 1.0, texel.g);
            texel.b = clamp(0.0, 1.0, texel.b);

            blur += kernel[kSize + j] * kernel[kSize + i] * texel.rgb;
        }
    }

    return blur / (sum*sum);
}

@fragment fn fragMain(fsInput: OurVertexShaderOutput) -> @location(0) vec4f {
    var uv = fsInput.fragUV;
    var fragCoord = fsInput.fragCoord;

    // 2. DoG
    var sigmaBase = 2.3;
    var sigmaSubtract = 3.4;

    var strongBlur = blur(fragCoord, sigmaSubtract);
    var weakBlur = blur(fragCoord, sigmaBase);

    // desaturate blurs
    var desaturatedSBlur = desaturate(strongBlur);
    var desaturatedWBlur = desaturate(weakBlur);
    
    // extended difference of gaussians
    var dog = (1.0 + uSigmaSubtract) * desaturatedWBlur - uSigmaSubtract * desaturatedSBlur;

    var thresh = uThresh;
    var colVal = clamp(dog.r, 0.0, 1.0);
    
    if(colVal > thresh) {
        dog = vec4(1.0);
    }
    else {
        var value = tanh(uScaler * (colVal*10.0 - thresh));
        dog = vec4(vec3(value), 1.0);
    }

    return vec4(dog);
}


 