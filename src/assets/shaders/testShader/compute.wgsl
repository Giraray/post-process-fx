@group(0) @binding(0) var colorBuffer: texture_storage_2d<rgba8unorm, write>;
@group(0) @binding(1) var uTexture: texture_2d<f32>;

var<workgroup> tile : array<array<vec4<f32>, 8>, 8>;

@compute @workgroup_size(8,8,1)
fn main(
    @builtin(global_invocation_id) global_id: vec3<u32>,
    @builtin(local_invocation_id) local_id: vec3<u32>,
    ) {

    let screenPos: vec2<i32> = vec2(i32(global_id.x), i32(global_id.y));
    let relativePos = vec2(f32(local_id.x), f32(local_id.y));

    var texColor = textureLoad(uTexture, screenPos, 0);

    tile[local_id.x][local_id.y] = ceil(texColor*10)/10;

    workgroupBarrier();

    var sum = vec4(0.0);
    for(var i = 0; i < 8; i++) {
        for(var j = 0; j < 8; j++) {
            sum += tile[i][j];
        }
    }

    sum /= 64.0;
    var color = vec4(0.3,0.2,0.7,1.0);
    var white = vec4(1.0);

    textureStore(colorBuffer, screenPos, color); 
}