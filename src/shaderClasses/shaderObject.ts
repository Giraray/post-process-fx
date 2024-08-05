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

export default abstract class ShaderObject {
    code: string;
    shaderModule: GPUShaderModule;
    pipeline: GPURenderPipeline;
    bindGroup: GPUBindGroup;
    renderTarget: GPUTexture;

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

    abstract createBindings(...args: any): unknown;

    render(options: RenderDescriptor) {

        if(options.finalRender === true && !options.context) {
            const e = new Error('Cannot render to canvas without context. Context must be specified if finalRender is True.');
            e.name = 'RenderError'
            throw e;
        }
        if(options.finalRender === false && !options.renderTarget) {
            const e = new Error('Missing render target. Render target must be specified if finalRender is false.');
            e.name = 'RenderError'
            throw e;
        }

        let textureOutput: GPUTexture;
        if(options.finalRender === false) {

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
    
        const shaderEncoder = this.device.createCommandEncoder({
            label: 'shader encoder',
        });

        const bindGroup = this.device.createBindGroup({
            layout: this.pipeline.getBindGroupLayout(0),
            entries: this.createBindings(this.time, options.size.width, options.size.height),
        });

        const shaderPass = shaderEncoder.beginRenderPass({
            colorAttachments: [{
                view: textureOutput.createView(),
                clearValue: [0,0,0,1],
                loadOp: 'clear',
                storeOp: 'store',
            }],
        });
        
        shaderPass.setPipeline(this.pipeline);
        shaderPass.setBindGroup(0, bindGroup);
        shaderPass.draw(6);
        shaderPass.end();
        
        this.device.queue.submit([shaderEncoder.finish()]);
    }

    renderOnTimer(options: RenderDescriptor) {
        clearInterval(this.timeout);
        this.timeout = setInterval(() => {

            const now = Date.now();
            const delta = this.lastUpdate - now;
            this.lastUpdate = now;
            this.time -= delta/1000;

            requestAnimationFrame(this.render.bind(this, options));
        }, 1000 / 60);
    }
}