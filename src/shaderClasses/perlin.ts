import perlinCode from '../assets/shaders/perlinNoise.wgsl?raw';

interface Size {
    width: number,
    height: number,
}

interface PerlinOptions {
    billowRidge?: boolean;
    seed: number;
    size: Size;
    canvasFormat: GPUTextureFormat;
    device: GPUDevice;
}

/**
 * Creates an object containing a `GPURenderPipeline` and a `GPUBindGroup` for 
 * a perlin noise texture.
 */
export class PerlinTexture implements PerlinOptions {

    billowRidge: boolean | undefined;
    size: Size;
    seed: number;
    readonly canvasFormat: GPUTextureFormat;
    readonly device: GPUDevice;

    pipeline: GPURenderPipeline;
    bindGroup: GPUBindGroup;

    constructor(options: PerlinOptions) {
        this.billowRidge = options.billowRidge ? true : false;
        this.size = options.size;
        this.canvasFormat = options.canvasFormat;
        this.device = options.device;
        this.seed = options.seed;
    }

    // create texture
    createTexture() {
        const device = this.device;
        const canvasFormat = this.canvasFormat

        const shaderModule = device.createShaderModule({
            label: 'perlin texture shader',
            code: perlinCode
        });

        // PIPELINE
        const bindGroupLayout = device.createBindGroupLayout({
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.FRAGMENT | GPUShaderStage.VERTEX,
                    buffer: {
                        type: 'uniform',
                    },
                },
                {
                    binding: 1,
                    visibility: GPUShaderStage.FRAGMENT | GPUShaderStage.VERTEX,
                    buffer: {
                        type: 'uniform',
                    },
                },
                {
                    binding: 2,
                    visibility: GPUShaderStage.FRAGMENT | GPUShaderStage.VERTEX,
                    buffer: {
                        type: 'uniform',
                    },
                }
            ]
        });

        this.pipeline = device.createRenderPipeline({
            label: 'perlin texture pipeline',
            layout: device.createPipelineLayout({bindGroupLayouts:[bindGroupLayout]}),
            vertex: {
                module: shaderModule,
            },
            fragment: {
                module: shaderModule,
                targets: [{format:canvasFormat}],
            },
        });

        // BINDINGS

        // billowRidge
        let billowValue = this.billowRidge ? 1 : 0;
        const billowBuffer = device.createBuffer({
            size: 4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });
        device.queue.writeBuffer(billowBuffer, 0, new Int32Array([billowValue]));

        // resolution
        const resBuffer = device.createBuffer({
            size:8,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });
        device.queue.writeBuffer(resBuffer, 0, new Float32Array([this.size.width, this.size.height]));

        // seed
        const seedBuffer = device.createBuffer({
            size: 4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });
        device.queue.writeBuffer(seedBuffer, 0, new Float32Array([this.seed]));

        this.bindGroup = device.createBindGroup({
            label: 'perlin bindgroup',
            layout: bindGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: {buffer: billowBuffer},
                },
                {
                    binding: 1,
                    resource: {buffer: resBuffer}
                },
                {
                    binding: 2,
                    resource: {buffer: seedBuffer}
                },
            ],
        });
    }
}