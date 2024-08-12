@group(0) @binding(0) var resultBuffer: texture_storage_2d<rgba8unorm, write>;
@group(0) @binding(1) var uTexture: texture_2d<f32>;

var<workgroup> tile : array<array<vec3<f32>, 8>, 8>;
const red = vec3(1.0,0.0,0.0);
const green = vec3(0.0,1.0,0.0);
const blue = vec3(0.0,0.0,1.0);

@compute @workgroup_size(8,8,1)
fn main(
    @builtin(global_invocation_id) global_id: vec3<u32>,
    @builtin(local_invocation_id) local_id: vec3<u32>,
    @builtin(num_workgroups) num: vec3<u32>,
    ) {

    let screenPos: vec2<i32> = vec2(i32(global_id.x), i32(global_id.y));
    // let relativePos = vec2(f32(local_id.x), f32(local_id.y));

    var texColor = textureLoad(uTexture, screenPos, 0);
    // var numCells: f32 = f32(num.x * num.y);

    // tile[local_id.x][local_id.y] = texColor.rgb;

    // workgroupBarrier();

    // // array that counts occurances of specific colors: red, green, blue, yellow and black
    // var histogram = vec4(0.0);
    // var yellow = vec3(1.0,1.0,0.0);

    // for(var i = 0; i < 8; i++) {
    //     for(var j = 0; j < 8; j++) {
    //         var targetColor: vec3<f32> = tile[i][j];
            
    //         // if vec3(x) == vec3(yellow) ... fml
    //         if(targetColor.r == yellow.r && targetColor.g == yellow.g && targetColor.b == yellow.b) {
    //             histogram += vec4(0.0,0.0,0.0,1.0);
    //         }
    //         else {
    //             histogram += vec4(targetColor, 0.0);
    //         }
    //     }
    // }

    // // bubble sort
    // var resultColor = vec3(0.0);
    // var max = 0.0;
    // if(histogram.r > max) {
    //     max = histogram.r;
    //     resultColor = red;
    // }
    // if(histogram.g > max) {
    //     max = histogram.g;
    //     resultColor = green;
    // }
    // if(histogram.b > max) {
    //     max = histogram.b;
    //     resultColor = blue;
    // }
    // if(histogram.a > max) {
    //     max = histogram.a;
    //     resultColor = yellow;
    // }
    // var color = vec4(resultColor, 1.0);

    var test = vec4(0.2,0.0,0.6,1.0);

    textureStore(resultBuffer, screenPos, test); 
}