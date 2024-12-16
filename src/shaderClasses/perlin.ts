import perlinCode from '../assets/shaders/perlinNoise.wgsl?raw';
import { perlinTextureConfig } from '../createConfig';
import {NumberConfig, EnumConfig, BoolConfig, RangeConfig, ColorConfig} from './objectBase';
import {TextureObject} from './textureObject';

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

/**
 * Creates an object containing a `GPURenderPipeline` and a `GPUBindGroup` for 
 * a perlin noise texture.
 */
export class PerlinTexture extends TextureObject {
    time: number = 0;
    size: Size;
    seed: number;

    pipeline: GPURenderPipeline;
    bindGroup: GPUBindGroup;

    timeout: ReturnType<typeof setTimeout>;

    lastUpdate: number;

    //config
    style: EnumConfig;
    intensity: NumberConfig;
    gridSize: NumberConfig;
    animate: BoolConfig;
    speed: NumberConfig;
    fractals: NumberConfig;
    posColor: ColorConfig;
    negColor: ColorConfig;

    constructor(device: GPUDevice, canvasFormat: GPUTextureFormat, context: GPUCanvasContext, size: Size) {
        super(device, canvasFormat, context);
        this.size = size;
        this.seed = Math.random()*100000;
        this.lastUpdate = Date.now();

        this.config = this.createConfig();
        this.intensity = <NumberConfig>this.config[0];
        this.gridSize = <NumberConfig>this.config[1];
        this.style = <EnumConfig>this.config[2];
        this.fractals = <NumberConfig>this.config[3];
        this.animate = <BoolConfig>this.config[4];
        this.speed = <NumberConfig>this.config[5];
        this.posColor = <ColorConfig>this.config[6];
        this.negColor = <ColorConfig>this.config[7];

        this.initTextureConfig(this.config, this);
    }

    handleNumber(target: HTMLInputElement, origin: PerlinTexture, item: NumberConfig) {
        let value = parseFloat(target.value);
        if(isNaN(value))
            value = 0;
        item.value = value;

        clearTimeout(origin.timeout);
        origin.renderToCanvas();
    }

    handleStyle(target: HTMLInputElement, origin: PerlinTexture, item: EnumConfig) {
        let value = target.value;
        item.value = value;

        clearTimeout(origin.timeout);
        origin.renderToCanvas();
    }

    handleAnimate(target: HTMLInputElement, origin: PerlinTexture, item: BoolConfig) {
        let value = target.checked === true ? true : false;
        item.value = value;

        clearTimeout(origin.timeout);
        origin.renderToCanvas();
    }

    handleColor(target: HTMLInputElement, origin: PerlinTexture, item: ColorConfig) {
        let value = target.value;
        item.value = value;

        clearTimeout(origin.timeout);
        origin.renderToCanvas();
    }

    createConfig(): (NumberConfig | EnumConfig | BoolConfig | ColorConfig)[] {
        const intensity: NumberConfig = {
            type: 'number',
            label: 'Intensity',
            id: 'intensity',
            title: 'Increases contrast',
            
            default: 1,
            value: 1,

            step: 0.1,

            event: this.handleNumber,
        };
        
        const gridSize: NumberConfig = {
            type: 'number',
            label: 'Grid size',
            id: 'gridSize',
            title: 'Texture size',
            
            default: 3,
            value: 3,

            step: 0.1,

            event: this.handleNumber,
        }

        const style: EnumConfig = {
            label: 'Style',
            id: 'style',
            type: 'enum',
            default: 'natural',
            value: 'natural',
            title: 'Noise style',
            options: [
                {label: 'Natural', id: 'natural'},
                {label: 'Fractal', id: 'fractal'},
                {label: 'Billow ridge', id: 'billowRidge'},
                {label: 'Normalized', id: 'normalized'},
            ],

            event: this.handleStyle
        }

        const fractals: NumberConfig = {
            type: 'number',
            label: 'Fractals',
            id: 'fractals',
            title: 'Fractal amount - No effect if "Style" is not "Fractal"',
            
            default: 5,
            value: 5,

            event: this.handleNumber,
        }

        const animate: BoolConfig = {
            type: 'bool',
            label: 'Animate',
            id: 'animate',
            title: 'Animates the texture',
            
            default: false,
            value: false,

            event: this.handleAnimate,
        }

        const speed: NumberConfig = {
            type: 'number',
            label: 'Sim. speed',
            id: 'speed',
            title: 'Simulation speed - No effect if "Animate" is false',
            
            default: 1,
            value: 1,

            event: this.handleNumber,
        }

        const negColor: ColorConfig = {
            type: 'color',
            label: 'Color 1',
            id: 'posColor',
            title: 'Color of positive values',

            default: '#ffffff',
            value: '#ffffff',

            event: this.handleColor,
        }

        const posColor: ColorConfig = {
            type: 'color',
            label: 'Color 2',
            id: 'negColor',
            // title: 'Color of negative values',
            title: "In progress!",

            default: '#000000',
            value: '#000000',

            disabled: true,

            event: this.handleColor,
        }

        return [intensity, gridSize, style, fractals, animate, speed, negColor, posColor];
    }

    setTimer() {
        clearInterval(this.timeout);
        this.timeout = setInterval(() => {

            const now = Date.now();
            const delta = this.lastUpdate - now;
            this.lastUpdate = now;
            this.time -= delta/1000;

            requestAnimationFrame(this.renderToCanvas.bind(this));
        }, 1000 / 30);
    }

    // create texture
    updateTexture() {
        const device = this.device;
        const canvasFormat = this.canvasFormat

        const shaderModule = device.createShaderModule({
            label: 'perlin texture shader',
            code: perlinCode
        });

        // PIPELINE
        const bindGroupLayout = device.createBindGroupLayout({
            entries: <Iterable<GPUBindGroupLayoutEntry>>[
                {
                    binding: 0,
                    visibility: GPUShaderStage.FRAGMENT,
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
                    visibility: GPUShaderStage.FRAGMENT,
                    buffer: {
                        type: 'uniform',
                    },
                },
                {
                    binding: 3,
                    visibility: GPUShaderStage.FRAGMENT,
                    buffer: {
                        type: 'uniform',
                    },
                },
                {
                    binding: 4,
                    visibility: GPUShaderStage.FRAGMENT,
                    buffer: {
                        type: 'uniform',
                    },
                },
                {
                    binding: 5,
                    visibility: GPUShaderStage.FRAGMENT,
                    buffer: {
                        type: 'uniform',
                    },
                },
                {
                    binding: 6,
                    visibility: GPUShaderStage.FRAGMENT,
                    buffer: {
                        type: 'uniform',
                    },
                },
                {
                    binding: 7,
                    visibility: GPUShaderStage.FRAGMENT,
                    buffer: {
                        type: 'uniform',
                    },
                },
                {
                    binding: 8,
                    visibility: GPUShaderStage.FRAGMENT,
                    buffer: {
                        type: 'uniform',
                    },
                },
                {
                    binding: 9,
                    visibility: GPUShaderStage.FRAGMENT,
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
        switch (this.style.value) {
            case 'fractal':
                styleValue = 1;
                break;
            case 'normalized':
                styleValue = 2;
                break;
            case 'billowRidge':
                styleValue = 3;
                break;
            case 'natural':
            default:
                styleValue = 4;
                break;
        }

        const usage_UniformCopy = GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST;

        // style
        const styleBuffer = device.createBuffer({size: 4,usage: usage_UniformCopy});
        device.queue.writeBuffer(styleBuffer, 0, new Int32Array([styleValue]));

        // resolution
        const resBuffer = device.createBuffer({size:8,usage: usage_UniformCopy});
        device.queue.writeBuffer(resBuffer, 0, new Float32Array([this.size.width, this.size.height]));

        // seed
        const seedBuffer = device.createBuffer({size: 4,usage: usage_UniformCopy});
        device.queue.writeBuffer(seedBuffer, 0, new Float32Array([this.seed]));

        // gridSize
        const gridBuffer = device.createBuffer({size: 4,usage: usage_UniformCopy});
        device.queue.writeBuffer(gridBuffer, 0, new Float32Array([<number>this.gridSize.value])); // bruh idfk what im doing man

        // intensity
        const intensityBuffer = device.createBuffer({size: 4,usage: usage_UniformCopy});
        device.queue.writeBuffer(intensityBuffer, 0, new Float32Array([<number>this.intensity.value]));

        // time
        const timeBuffer = device.createBuffer({size: 4,usage: usage_UniformCopy});
        device.queue.writeBuffer(timeBuffer, 0, new Float32Array([this.time]));

        // speed
        const speedBuffer = device.createBuffer({size: 4,usage: usage_UniformCopy});
        device.queue.writeBuffer(speedBuffer, 0, new Float32Array([<number>this.speed.value]));

        // fractals
        const fractalsBuffer = device.createBuffer({size: 4,usage: usage_UniformCopy});
        device.queue.writeBuffer(fractalsBuffer, 0, new Float32Array([<number>this.fractals.value]));

        // colors
        const posColorBuffer = device.createBuffer({size: 12,usage: usage_UniformCopy});
        device.queue.writeBuffer(posColorBuffer, 0, new Float32Array(<number[]>this.hexToRgb(this.posColor.value)));

        const negColorBuffer = device.createBuffer({size: 12,usage: usage_UniformCopy});
        device.queue.writeBuffer(negColorBuffer, 0, new Float32Array(<number[]>this.hexToRgb(this.negColor.value)));

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
                {
                    binding: 6,
                    resource: {buffer: speedBuffer}
                },
                {
                    binding: 7,
                    resource: {buffer: fractalsBuffer}
                },
                {
                    binding: 8,
                    resource: {buffer: posColorBuffer}
                },
                {
                    binding: 9,
                    resource: {buffer: negColorBuffer}
                },
            ],
        });
    }

    public resizeCanvas() {
        const canvas = <HTMLCanvasElement>this.context.canvas;
        canvas.width = this.size.width;
        canvas.height = this.size.height;

        canvas.style.width = this.size.width + 'px';
        canvas.style.height = this.size.height + 'px';
    }

    public renderToCanvas() {
        // render texture
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
            colorAttachments: [<GPURenderPassColorAttachment>{
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
            const renderOptions = {
                size: {
                    width: this.size.width,
                    height: this.size.height,
                },
                canvasFormat: this.canvasFormat,
                context: this.context,
            }

            shader.texture = textureOutput;

            if(this.shader.static == true) {
                shader.render(renderOptions);
            }
            else{
                shader.renderOnTimer(renderOptions);
            }
        }

        this.dataUrl = (<HTMLCanvasElement>this.context.canvas).toDataURL('image/png');

        if(this.animate.value === true) {
            this.setTimer();
        }
    }
}