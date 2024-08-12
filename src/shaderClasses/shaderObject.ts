interface Size {
    width: number,
    height: number,
}

interface RenderDescriptor {
    size: Size;
    canvasFormat: GPUTextureFormat,
    context?: GPUCanvasContext;
    finalRender?: boolean;
    renderTarget?: GPUTexture
}

type ShaderType =
    'render' |
    'compute'

export interface ShaderProgram {
    label: string;
    passType: ShaderType;
    pipeline: GPURenderPipeline | GPUComputePipeline;
    entries: Array<GPUBindGroupEntry>;
    workgroupSize?: number;
}

export interface ProgramInstructions {
    label: string;
    passes: Array<ShaderProgram>;
}

export abstract class ShaderObject {
    code: string;
    shaderModule: GPUShaderModule;
    pipeline: GPURenderPipeline;
    bindGroup: GPUBindGroup;
    texture: GPUTexture;

    timeout: number;
    time: number;
    lastUpdate: number;

    readonly device: GPUDevice;
    readonly sampler: GPUSampler;

    constructor(device: GPUDevice) {
        this.device = device;
        this.sampler = device.createSampler();
        this.time = 0;
        this.lastUpdate = Date.now();
    }

    abstract createInstructions(...args: any): ProgramInstructions;

    render(options: RenderDescriptor) {
        let textureOutput: GPUTexture;
        const instructions = this.createInstructions(this.time, options.size.width, options.size.height);
        for(let i = 1; i <= instructions.passes.length; i++) {
            const shader = instructions.passes[i-1];

            // if this shader is NOT the first operation, then use previously made textureOutput as 
            // a render target
            if(i-1 > 0 && instructions.passes[i-2].passType != 'compute') {
                shader.entries[1].resource = textureOutput.createView();
            }

            // if this shader is not the last operation, then create a new GPUTexture as an output 
            if(i < instructions.passes.length) {
                const renderTarget = this.device.createTexture({
                    label: 'texA placeholder',
                    format: options.canvasFormat,
                    size: [options.size.width, options.size.height],
                    usage: 
                        GPUTextureUsage.TEXTURE_BINDING |
                        GPUTextureUsage.RENDER_ATTACHMENT |
                        GPUTextureUsage.COPY_SRC
                });
                textureOutput = renderTarget
            }
            else {
                textureOutput = options.context.getCurrentTexture();
            }

            // if shader is a render shader, then do rendering stuff
            if(shader.passType === 'render') {

                const pass = this.device.createCommandEncoder({
                    label: shader.label,
                });
                const bindGroup = this.device.createBindGroup({
                    layout: shader.pipeline.getBindGroupLayout(0),
                    entries: shader.entries
                });
                const renderPass = pass.beginRenderPass({
                    colorAttachments: [{
                        view: textureOutput.createView(),
                        clearValue: [0,0,0,1],
                        loadOp: 'clear',
                        storeOp: 'store',
                    }],
                });

                renderPass.setPipeline(<GPURenderPipeline>shader.pipeline);
                renderPass.setBindGroup(0, bindGroup);
                renderPass.draw(6);
                renderPass.end();
                
                this.device.queue.submit([pass.finish()]);
            }
            else if(shader.passType = 'compute') {
                const pass = this.device.createCommandEncoder({
                    label: shader.label,
                });
                const bindGroup = this.device.createBindGroup({
                    layout: shader.pipeline.getBindGroupLayout(0),
                    entries: shader.entries,
                });
                const computePass = pass.beginComputePass();
                computePass.setPipeline(<GPUComputePipeline>shader.pipeline);
                computePass.setBindGroup(0, bindGroup);

                const w = options.size.width;
                const h = options.size.height;

                computePass.dispatchWorkgroups(Math.ceil(w/8), Math.ceil(h/8), 1);
                computePass.end();
            }
        }
    }

    renderOnTimer(options: RenderDescriptor) {
        clearInterval(this.timeout);
        this.timeout = setInterval(() => {

            const now = Date.now();
            const delta = this.lastUpdate - now;
            this.lastUpdate = now;
            this.time -= delta/1000;

            requestAnimationFrame(this.render.bind(this, options));
        }, 1000 / 10);
    }
}