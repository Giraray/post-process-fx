import shaderCode from '../assets/shaders/defaultShader.wgsl?raw';

interface Size {
    width: number,
    height: number,
}

interface ImgTextureOptions {
    size: Size;
    canvasFormat: GPUTextureFormat;
    device: GPUDevice;
    source: ImageBitmap;
}

export class ImgTexture {

    size: Size;
    canvasFormat: GPUTextureFormat;
    device: GPUDevice;
    source: ImageBitmap;

    texture: GPUTexture;
    bindGroup: GPUBindGroup;
    pipeline: GPURenderPipeline;

    constructor(options: ImgTextureOptions) {
        this.size = options.size;
        this.canvasFormat = options.canvasFormat;
        this.device = options.device;
        this.source = options.source;
    }

    createTexture() {
        const source = this.source;
        const device = this.device;

        // texture
        const texture = device.createTexture({
            label: 'imgTexture',
            format: 'rgba8unorm',
            size: [source.width, source.height],
            usage: 
                GPUTextureUsage.COPY_DST |
                GPUTextureUsage.TEXTURE_BINDING |
                GPUTextureUsage.RENDER_ATTACHMENT,
        });
        device.queue.copyExternalImageToTexture(
            {source: source, flipY: true},
            {texture: texture},
            {width: source.width, height: source.height},
        );
        this.texture = texture; // declare

        // shader module
        const shaderModule = device.createShaderModule({
            label: 'default shader module',
            code: shaderCode,
        });

        // render pipeline
        const pipeline = device.createRenderPipeline({
            label: 'render pipeline',
            layout: 'auto',
            vertex: {
                module: shaderModule,
            },
            fragment: {
                module: shaderModule,
                targets: [{format:this.canvasFormat}],
            },
        })

        // sampler
       const sampler = device.createSampler();

        // bindgroup
        const bindGroup = device.createBindGroup({
            layout: pipeline.getBindGroupLayout(0),
            entries: [
                {binding: 0, resource: sampler},
                {binding: 1, resource: this.texture.createView()},
            ],
        });

        this.bindGroup = bindGroup;
        this.pipeline = pipeline;
    }

    public resizeCanvas(canvas: HTMLCanvasElement) {
        const maxW = parseInt(canvas.style.maxWidth.slice(0,-2)); // bruh
        const maxH = parseInt(canvas.style.maxHeight.slice(0,-2));

        if(this.size.width > maxW)
            this.size.width = maxW;
        if(this.size.height > maxH)
            this.size.height = maxH;

        canvas.style.width = this.size.width + 'px';
        canvas.style.height = this.size.height + 'px';

        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
    }
}