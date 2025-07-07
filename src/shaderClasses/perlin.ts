import perlinCode from '../assets/shaders/perlinNoise.wgsl?raw';
import { perlinTextureConfig } from '../createConfig';
import {NumberConfig, EnumConfig, BoolConfig, RangeConfig, ColorConfig} from './objectBase';
import {TextureObject} from './textureObject';

interface Size {
    width: number,
    height: number,
}

/**
 * Creates an object containing a `GPURenderPipeline` and a `GPUBindGroup` for 
 * a perlin noise texture.
 */
export class PerlinTexture extends TextureObject {
    seed: number;

    constructor(device: GPUDevice, canvasFormat: GPUTextureFormat, context: GPUCanvasContext, size: Size) {
        super(device, canvasFormat, context);
        this.size = size;
        this.seed = Math.random()*100000;
        this.lastUpdate = Date.now();
        this.static = true;

        this.configArray = this.createConfig();
        this.config = this.sortConfigs(this.configArray)

        this.initTextureConfig(this.config, this);
    }

    handleAnimate(target: HTMLInputElement, origin: PerlinTexture, item: BoolConfig) {
        let value = target.checked === true ? true : false;
        item.value = value;

        clearTimeout(origin.timeout);
        origin.render();
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
            clearTimeout: true,

            event: this.handleNumberConfig,
        };
        
        const gridSize: NumberConfig = {
            type: 'number',
            label: 'Grid size',
            id: 'gridSize',
            title: 'Texture size',
            
            default: 18,
            value: 18,

            step: 0.1,

            event: this.handleNumberConfig,
        }

        const style: EnumConfig = {
            label: 'Style',
            id: 'style',
            type: 'enum',
            default: 'normalized',
            value: 'normalized',
            title: 'Noise style',
            options: [
                {label: 'Natural', id: 'natural'},
                {label: 'Fractal', id: 'fractal'},
                {label: 'Billow ridge', id: 'billowRidge'},
                {label: 'Normalized', id: 'normalized'},
            ],

            event: this.handleEnumConfig
        }

        const fractals: NumberConfig = {
            type: 'number',
            label: 'Fractals',
            id: 'fractals',
            title: 'Fractal amount - No effect if "Style" is not "Fractal"',
            
            default: 5,
            value: 5,

            event: this.handleNumberConfig,
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

            event: this.handleNumberConfig,
        }

        const negColor: ColorConfig = {
            type: 'color',
            label: 'Color 1',
            id: 'posColor',
            title: 'Color of positive values',

            default: '#ffffff',
            value: '#ffffff',

            event: this.handleColorConfig,
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

            event: this.handleColorConfig,
        }
        const fps: NumberConfig = {
            type: 'number',
            label: 'FPS',
            id: 'fps',
            title: "FPS of texture and shader - No effect if Animate is off",

            default: 30,
            value: 30,

            disabled: true,

            event: this.handleNumberConfig,
        }

        return [intensity, gridSize, style, fractals, animate, fps, speed, negColor, posColor];
    }

    // create texture
    updateTexture() {
        const device = this.device;
        const canvasFormat = this.canvasFormat

        const shaderModule = device.createShaderModule({
            label: 'perlin texture shader',
            code: perlinCode
        });

        this.pipeline = device.createRenderPipeline({
            label: 'perlin texture pipeline',
            layout: 'auto',
            vertex: {
                module: shaderModule,
            },
            fragment: {
                module: shaderModule,
                targets: [{format:canvasFormat}],
            },
        });

        // BINDINGS
        const intensity = this.findIndex('intensity');
        const style = this.findIndex('style')
        const gridSize = this.findIndex('gridSize');
        const fractals = this.findIndex('fractals');
        const speed = this.findIndex('speed');
        const negColor = this.findIndex('negColor');
        const posColor = this.findIndex('posColor');
        const config = this.config;

        // style options
        let styleValue: number;
        switch (this.config[style].value) {
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

        const usage = GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST;

        // style
        const styleBuffer = device.createBuffer({size: 4,usage: usage});
        device.queue.writeBuffer(styleBuffer, 0, new Int32Array([styleValue]));

        // resolution
        const resBuffer = device.createBuffer({size:8,usage: usage});
        device.queue.writeBuffer(resBuffer, 0, new Float32Array([this.size.width, this.size.height]));

        // seed
        const seedBuffer = device.createBuffer({size: 4,usage: usage});
        device.queue.writeBuffer(seedBuffer, 0, new Float32Array([100]));
        // device.queue.writeBuffer(seedBuffer, 0, new Float32Array([this.seed]));

        // normal configs
        const gridBuffer = this.numberBuffer(4, this.config[gridSize]);
        const intensityBuffer = this.numberBuffer(4, this.config[intensity]);
        const speedBuffer = this.numberBuffer(4, this.config[speed]);
        const fractalsBuffer = this.numberBuffer(4, this.config[fractals]);

        // time
        const timeBuffer = device.createBuffer({size: 4,usage: usage});
        device.queue.writeBuffer(timeBuffer, 0, new Float32Array([this.time]));

        // colors
        const posColorBuffer = device.createBuffer({size: 12,usage: usage});
        device.queue.writeBuffer(posColorBuffer, 0, new Float32Array(<number[]>this.hexToRgb(<string>config[posColor].value)));
        const negColorBuffer = device.createBuffer({size: 12,usage: usage});
        device.queue.writeBuffer(negColorBuffer, 0, new Float32Array(<number[]>this.hexToRgb(<string>config[negColor].value)));

        this.bindGroup = device.createBindGroup({
            label: 'perlin bindgroup',
            layout: this.pipeline.getBindGroupLayout(0),
            entries: [
                {binding: 0,resource: {buffer: styleBuffer}},
                {binding: 1,resource: {buffer: resBuffer}},
                {binding: 2,resource: {buffer: seedBuffer}},
                {binding: 3,resource: {buffer: gridBuffer}},
                {binding: 4,resource: {buffer: intensityBuffer}},
                {binding: 5,resource: {buffer: timeBuffer}},
                {binding: 6,resource: {buffer: speedBuffer}},
                {binding: 7,resource: {buffer: fractalsBuffer}},
                {binding: 8,resource: {buffer: posColorBuffer}},
                {binding: 9,resource: {buffer: negColorBuffer}},
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
}