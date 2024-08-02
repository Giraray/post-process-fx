export default abstract class ShaderObject {
    code: string;
    shaderModule: GPUShaderModule;
    pipeline: GPURenderPipeline;
    bindGroup: GPUBindGroup;
    renderTarget: GPUTexture;
    readonly device: GPUDevice;
    readonly sampler: GPUSampler;

    constructor(device: GPUDevice) {
        this.device = device;
        this.sampler = device.createSampler();
    }

    abstract createBindings(...args: any): unknown;
}