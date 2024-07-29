import perlinCode from '../assets/shaders/perlinNoise.wgsl?raw';
import {ImgTextureUserConfig} from '../configObjects'
import { imgTextureConfig } from '../createConfig';

interface Size {
    width: number,
    height: number,
}

/**
 * User-configurable options.
 * @param style {@link StyleOptions} with variable computing of the Perlin noise. Default is "natural"
 * @param gridSize Zoom level. Default is 2
 * @param intensity Noise multiplication. Default is 1
 */
interface PerlinConfig {
    style?: StyleOptions;
    gridSize?: number;
    intensity?: number;
    animate?: boolean;
}

type StyleOptions =
    | 'billowRidge'
    | 'natural'
    | 'normalized';

interface PerlinOptions {
    config?: PerlinConfig;
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

    // TODO: create an abstract TextureObject class to localize renderToCanvas() to every texture, in 
    //       order to make rendering again based on input easier

    time: number = 0;
    config?: PerlinConfig;
    size: Size;
    seed: number;
    readonly canvasFormat: GPUTextureFormat;
    readonly device: GPUDevice;

    pipeline: GPURenderPipeline;
    bindGroup: GPUBindGroup;

    constructor(options: PerlinOptions) {
        this.size = options.size;
        this.canvasFormat = options.canvasFormat;
        this.device = options.device;
        this.seed = options.seed;
        this.config = options.config ? options.config : undefined;

        if(!this.config.animate)
            this.config.animate = false;
        if(!this.config.intensity)
            this.config.intensity = 1;
        if(!this.config.gridSize)
            this.config.gridSize = 2;

        // generate user config
        document.getElementById('textureOptions').innerHTML = imgTextureConfig;

        // EVENT LISTENERS
        const config = this.config;
        const intensityElm = <HTMLInputElement>document.getElementById('intensity');
        const styleElm = <HTMLSelectElement>document.getElementById('style');
        const gridSizeElm = <HTMLInputElement>document.getElementById('gridSize');
        const animateElm = <HTMLInputElement>document.getElementById('animate');

        // intensity
        intensityElm.addEventListener('change', function(event) {
            let value = parseInt((event.target as HTMLInputElement).value);
            if(isNaN(value))
                value = 0;
            config.intensity = value;
        })

        // style
        styleElm.addEventListener('change', function(event) {
            let value = (event.target as HTMLInputElement).value;
            config.style = value as StyleOptions;
        })

        // gridSize
        gridSizeElm.addEventListener('change', function(event) {
            let value = parseInt((event.target as HTMLInputElement).value);
            if(isNaN(value))
                value = 0;
            config.gridSize = value;
        })

        // animate
        animateElm.addEventListener('change', function(event) {
            let value = (event.target as HTMLInputElement).checked === true ? true : false;
            config.animate = value;
        })
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
                },
                {
                    binding: 3,
                    visibility: GPUShaderStage.FRAGMENT | GPUShaderStage.VERTEX,
                    buffer: {
                        type: 'uniform',
                    },
                },
                {
                    binding: 4,
                    visibility: GPUShaderStage.FRAGMENT | GPUShaderStage.VERTEX,
                    buffer: {
                        type: 'uniform',
                    },
                },
                {
                    binding: 5,
                    visibility: GPUShaderStage.FRAGMENT | GPUShaderStage.VERTEX,
                    buffer: {
                        type: 'uniform',
                    },
                },
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

        // style options
        let styleValue: number;
        switch (this.config.style) {
            case 'billowRidge':
                styleValue = 1;
                break;
            case 'normalized':
                styleValue = 2;
                break;
            case 'natural':
            default:
                styleValue = 3;
                break;
        }

        const styleBuffer = device.createBuffer({
            size: 4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });
        device.queue.writeBuffer(styleBuffer, 0, new Int32Array([styleValue]));

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

        // gridSize
        const gridBuffer = device.createBuffer({
            size: 4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });
        device.queue.writeBuffer(gridBuffer, 0, new Float32Array([this.config.gridSize]));

        // intensity
        const intensityBuffer = device.createBuffer({
            size: 4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });
        device.queue.writeBuffer(intensityBuffer, 0, new Float32Array([this.config.intensity]));

        // time
        const timeBuffer = device.createBuffer({
            size: 4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });
        device.queue.writeBuffer(timeBuffer, 0, new Float32Array([this.time]));

        this.bindGroup = device.createBindGroup({
            label: 'perlin bindgroup',
            layout: bindGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: {buffer: styleBuffer},
                },
                {
                    binding: 1,
                    resource: {buffer: resBuffer}
                },
                {
                    binding: 2,
                    resource: {buffer: seedBuffer}
                },
                {
                    binding: 3,
                    resource: {buffer: gridBuffer}
                },
                {
                    binding: 4,
                    resource: {buffer: intensityBuffer}
                },
                {
                    binding: 5,
                    resource: {buffer: timeBuffer}
                },
            ],
        });
    }

    public resizeCanvas(canvas: HTMLCanvasElement) {
        canvas.width = this.size.width;
        canvas.height = this.size.height;

        canvas.style.width = this.size.width + 'px';
        canvas.style.height = this.size.height + 'px';
    }

    public updateTime(delta: number) {
        this.time += delta;
    }
}