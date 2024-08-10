import shaderCode from '../assets/shaders/defaultShader.wgsl?raw';
import TextureObject from './textureObject';
import { imgTextureConfig } from '../createConfig';

interface Size {
    width: number,
    height: number,
}

export class ImgTexture extends TextureObject {

    size: Size;
    canvasFormat: GPUTextureFormat;
    device: GPUDevice;
    source: ImageBitmap;
    container: HTMLDivElement;
    sizeMultiplier: Size;

    resize: boolean;

    bindGroup: GPUBindGroup;
    pipeline: GPURenderPipeline;

    constructor(
        device: GPUDevice, canvasFormat: GPUTextureFormat, context: GPUCanvasContext, source: ImageBitmap
    ) {
        super(device, canvasFormat, context);
        this.container = <HTMLDivElement>document.getElementById('imgDisp');
        this.sizeMultiplier = {width: 1,height: 1,};
        this.source = source;

        this.resizeDimensions(true);
    }

    resizeDimensions(resize: boolean) {
        if(resize === false) {
            this.sizeMultiplier = {
                width: 1,
                height: 1,
            };
        }
        else {
            const source = this.source;
            const w = this.container.clientWidth;
            const h = this.container.clientHeight;
            
            if(source.width/source.height > w/h) {
                this.sizeMultiplier.height = w / source.width;
                this.sizeMultiplier.width = w / source.width;
            }
            else {
                this.sizeMultiplier.height = h / source.height;
                this.sizeMultiplier.width = h / source.height;
            }
        }

        this.size = {
            width: this.source.width * this.sizeMultiplier.width,
            height: this.source.height * this.sizeMultiplier.height,
        }
    }

    initConfig() {
        // generate user config
        document.getElementById('textureOptions').innerHTML = imgTextureConfig;

        // EVENT LISTENERS
        const self = this;
        const resizeElm = <HTMLInputElement>document.getElementById('resize');

        // resize
        resizeElm.addEventListener('change', function(event) {
            let value = (event.target as HTMLInputElement).checked === true ? true : false;
            self.resize = value;

            self.renderToCanvas();
        });
    }

    updateTexture() {
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
        let flipped: boolean = true;
        if(this.shader)
            flipped = false;
        device.queue.copyExternalImageToTexture(
            {source: source, flipY: false},
            {texture: texture},
            {width: source.width, height: source.height},
        );

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
                {binding: 1, resource: texture.createView()},
            ],
        });

        this.bindGroup = bindGroup;
        this.pipeline = pipeline;
    }

    public renderToCanvas() {
        this.updateTexture();

        // create renderTarget if a shader is to be applied; otherwise use context
        let textureOutput: GPUTexture;
        if(this.shader) {

            const renderTarget = this.device.createTexture({
                label: 'texA placeholder',
                format: this.canvasFormat,
                size: [this.size.width, this.size.height],
                usage: 
                    GPUTextureUsage.TEXTURE_BINDING |
                    GPUTextureUsage.RENDER_ATTACHMENT |
                    GPUTextureUsage.COPY_SRC
            });

            textureOutput = renderTarget
        }
        else {
            textureOutput = this.context.getCurrentTexture();
        }

        const textureEncoder = this.device.createCommandEncoder({
            label: 'texEncoder',
        });
        const pass = textureEncoder.beginRenderPass({
            label: 'defaultImg pass',
            colorAttachments: [{
                view: textureOutput.createView(),
                clearValue: [0, 0, 0, 1],
                loadOp: 'clear',
                storeOp: 'store',
            }],
        });
        pass.setPipeline(this.pipeline);
        pass.setBindGroup(0, this.bindGroup);
        pass.draw(6);
        pass.end();

        this.device.queue.submit([textureEncoder.finish()]);

        // RENDER SHADER (if exists)
        if(this.shader) {
            const shader = this.shader;

            shader.texture = textureOutput;
            shader.renderOnTimer({
                size: {
                    width: this.size.width,
                    height: this.size.height,
                },
                canvasFormat: this.canvasFormat,
                context: this.context,
                finalRender: true,
            });
        }

        this.dataUrl = (<HTMLCanvasElement>this.context.canvas).toDataURL('image/png');
    }

    public resizeCanvas() {
        const canvas = <HTMLCanvasElement>this.context.canvas;
        canvas.width = this.size.width;
        canvas.height = this.size.height;

        canvas.style.width = this.size.width + 'px';
        canvas.style.height = this.size.height + 'px';
    }
}