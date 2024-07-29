export default abstract class ShaderObject {
    code: string;
    shaderModule: GPUShaderModule;
    pipeline: GPURenderPipeline;
    bindGroup: GPUBindGroup;
}