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

    handleScale(target: HTMLInputElement, origin: ImgTexture, item: NumberConfig) {
        let value = parseFloat(target.value);
        if(isNaN(value))
            value = 0;
        item.value = value;

        origin.resizeDimensions(<boolean>origin.config[origin.findIndex('resize')].value);
        origin.resizeCanvas();
        origin.render();
    }

    handleResize(target: HTMLInputElement, origin: ImgTexture, item: BoolConfig) {
        let value = target.checked === true ? true : false;
        item.value = value;

        origin.resizeDimensions(value);
        origin.resizeCanvas();
        origin.render();
    }

    createConfig(): (BoolConfig | NumberConfig)[] {
        const resize: BoolConfig = {
            type: 'bool',
            label: 'Resize',
            id: 'resize',
            title: 'Resizes the image to fit the container',
            
            default: true,
            value: true,

            event: this.handleResize,
        };
        const scale: NumberConfig = {
            type: 'number',
            label: 'Scale',
            id: 'scale',
            title: 'Scales the image - Does nothing if resize is on',

            default: 1,
            value: 1,
            step: 0.1,

            event: this.handleScale,
        }
        const contrast: NumberConfig = {
            type: 'number',
            label: 'Contrast',
            id: 'contrast',
            title: 'Contrast of the source image',
            
            default: 1.0,
            value: 1.0,

            step: 0.1,

            event: this.handleNumberConfig,
        }

        const brightness: NumberConfig = {
            type: 'number',
            label: 'Brightness',
            id: 'brightness',
            title: 'Brightness of the source image - Does not change much without an extraordinary large amount. \nLooks cool when it does though',
            
            default: 1.0,
            value: 1.0,

            step: 0.1,

            event: this.handleNumberConfig,
        }
        return [resize, scale, contrast, brightness];
    }

    resizeDimensions(resize: boolean) {
        const w = this.preferredContainerSize.width;
        const h = this.preferredContainerSize.height;
        const scale = <number>this.config[this.findIndex('scale')].value;

        if(resize === false) {
            this.sizeMultiplier = {
                width: 1 * scale,
                height: 1 * scale,
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

        // configs
        const contrast = this.findIndex('contrast');
        const brightness = this.findIndex('brightness');

        const usage = GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST;

        // contrast
        const contrastBuffer = this.device.createBuffer({size: 4,usage: usage});
        this.device.queue.writeBuffer(contrastBuffer, 0, new Float32Array([<number>this.config[contrast].value]));

        // brightness
        const brightnessBuffer = this.device.createBuffer({size: 4,usage: usage});
        this.device.queue.writeBuffer(brightnessBuffer, 0, new Float32Array([<number>this.config[brightness].value]));

        
        // sampler
       const sampler = device.createSampler();

        // bindgroup
        const bindGroup = device.createBindGroup({
            layout: pipeline.getBindGroupLayout(0),
            entries: [
                {binding: 0, resource: sampler},
                {binding: 1, resource: texture.createView()},
                {binding: 2, resource: { buffer: contrastBuffer }},
                {binding: 3, resource: { buffer: brightnessBuffer }},
            ],
        });

        this.bindGroup = bindGroup;
        this.pipeline = pipeline;
    }
}