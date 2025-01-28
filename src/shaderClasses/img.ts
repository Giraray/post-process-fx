import shaderCode from '../assets/shaders/defaultShader.wgsl?raw';
import {TextureObject} from './textureObject';
import {NumberConfig, EnumConfig, BoolConfig, RangeConfig} from './objectBase';

interface Size {
    width: number,
    height: number,
}

export class ImgTexture extends TextureObject {

    size: Size;
    readonly canvasFormat: GPUTextureFormat;
    readonly device: GPUDevice;
    source: ImageBitmap;
    sizeMultiplier: Size;

    constructor(
        device: GPUDevice, canvasFormat: GPUTextureFormat, context: GPUCanvasContext, source: ImageBitmap
    ) {
        super(device, canvasFormat, context);
        this.sizeMultiplier = {width: 1,height: 1,};
        this.source = source;
        this.static = true;

        this.configArray = this.createConfig();
        this.config = this.sortConfigs(this.configArray);

        this.resizeDimensions(<boolean>this.config[this.findIndex('resize')].value);
        this.initTextureConfig(this.config, this);
    }

    handleResize(target: HTMLInputElement, origin: ImgTexture, item: BoolConfig) {
        let value = target.checked === true ? true : false;
        item.value = value;

        origin.resizeDimensions(value);
        origin.resizeCanvas();
        origin.render();
    }

    createConfig(): [BoolConfig] {
        const resize: BoolConfig = {
            type: 'bool',
            label: 'Resize',
            id: 'resize',
            title: 'Resizes the image to fit the container',
            
            default: true,
            value: true,

            event: this.handleResize,
        };
        return [resize];
    }

    resizeDimensions(resize: boolean) {
        const w = this.preferredContainerSize.width;
        const h = this.preferredContainerSize.height;

        if(resize === false) {
            this.sizeMultiplier = {
                width: 1,
                height: 1,
            };
        }
        else {
            const source = this.source;
            
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

    public resizeCanvas() {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const body = document.getElementsByTagName('body')[0];

        if(this.size.width > vw) {
            this.container.style.justifyContent = 'flex-start';
            body.style.alignItems = 'start';
        }
        else {
            this.container.style.justifyContent = 'center';
            body.style.alignItems = 'center';
        }

        if(this.size.height > vh) {
            this.container.style.alignItems = 'flex-start';
        }
        else {
            this.container.style.alignItems = 'center';
        }

        const canvas = <HTMLCanvasElement>this.context.canvas;
        canvas.width = this.size.width;
        canvas.height = this.size.height;

        canvas.style.width = this.size.width + 'px';
        canvas.style.height = this.size.height + 'px';
    }
}