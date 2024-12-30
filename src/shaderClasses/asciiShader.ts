import asciiDogCode from '../assets/shaders/ascii/asciiDoG.wgsl?raw';
import asciiSobelCode from '../assets/shaders/ascii/asciiSobel.wgsl?raw';
import asciiDownscaleCode from '../assets/shaders/ascii/asciiDownscale.wgsl?raw';
import asciiConvertCode from '../assets/shaders/ascii/asciiConvert.wgsl?raw';
import {ShaderObject, ProgramInstructions, ShaderProgram} from './shaderObject';

import {NumberConfig, EnumConfig, BoolConfig, RangeConfig, StringConfig, ColorConfig, ConfigInputBase} from './objectBase';

import {Bitmap, testBitmap, bitmapEdgeVer1_Data, bitmapVer4_Data, bitmapVer5_Data } from '../assets/bitmaps/bitmaps';

export default class AsciiShader extends ShaderObject {
    constructor(device: GPUDevice, canvasFormat: GPUTextureFormat) {
        super(device, canvasFormat);
        this.code = asciiDogCode;
        this.static = true;
        this.shaderModule = device.createShaderModule({
            code: this.code,
        });
        this.pipeline = device.createRenderPipeline({
            layout: 'auto',
            vertex: {
                module: this.shaderModule,
            },
            fragment: {
                module: this.shaderModule,
                targets: [{format: canvasFormat}],
            }
        });

        this.configArray = this.createConfig();
        this.config = super.sortConfigs(this.configArray);

        this.initTextureConfig(this.config, this);

        this.metadata = {
            name: 'ASCII shader',
        }
        this.updateMetadata();
    }

    createConfig(): (NumberConfig | BoolConfig | ColorConfig | StringConfig)[] {
        const drawEdges: BoolConfig = {
            type: 'bool',
            label: 'Draw edges',
            id: 'drawEdges',
            title: 'Draws ASCII edges - High performance impact',

            default: true,
            value: true,

            event: this.handleBoolConfig,
        }

        const edgeThreshold: NumberConfig = { // todo rangeConfig
            type: 'number',
            label: 'Edge threshold',
            id: 'edgeThreshold',
            title: 'Edge strength theshold - No effect if "Draw edges" is false',
            
            default: 10,
            value: 10,
            min: 0,
            max: 64,

            event: this.handleNumberConfig,
        }

        const bitmapSet: StringConfig = { // todo indepth user explanation
            type: 'string',
            label: 'Bitmap set',
            id: 'bitmapSet',
            // title: 'ASCII bitmap set',
            title: "In progress!",
            
            default: '',
            value: '',

            disabled: true,

            event: this.handleStringConfig,
        }

        const colorAscii: ColorConfig = {
            type: 'color',
            label: 'Color 1',
            id: 'colorAscii',
            title: 'ASCII color',
            
            default: "#ffffff",
            value: "#ffffff",

            event: this.handleColorConfig,
        }

        const colorBg: ColorConfig = {
            type: 'color',
            label: 'Color 2',
            id: 'colorBg',
            title: 'Background color',
            
            default: "#000000",
            value: "#000000",

            event: this.handleColorConfig,
        }

        const dogStrength: NumberConfig = {
            type: 'number',
            label: 'Detail level',
            id: 'dogStrength',
            title: 'Controls the strength of the difference of gaussians - No effect if "Draw edges" is false',
            
            default: 1,
            value: 1,

            step: 0.1,

            event: this.handleNumberConfig,
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

        return [drawEdges, edgeThreshold, dogStrength, bitmapSet, colorAscii, colorBg, contrast, brightness];
    }

    createBitmap(data: Bitmap): GPUTexture {
        const bitmap = this.device.createTexture({
            label: 'bitmap',
            format: 'rgba8unorm',
            size: data.size,
            usage: 
                GPUTextureUsage.COPY_DST |
                GPUTextureUsage.TEXTURE_BINDING |
                GPUTextureUsage.RENDER_ATTACHMENT,
        });
        this.device.queue.writeTexture(
            {texture: bitmap},
            data.data,
            {bytesPerRow: data.size.width * 4},
            {width: data.size.width, height: data.size.height},
        );
        return bitmap;
    }

    createInstructions(time: number, width: number, height: number): ProgramInstructions {
        const drawEdges = this.findIndex('drawEdges');
        const edgeThreshold = this.findIndex('edgeThreshold');
        const bitmapSet = this.findIndex('bitmapSet');
        const colorAscii = this.findIndex('colorAscii');
        const colorBg = this.findIndex('colorBg');
        const dogStrength = this.findIndex('dogStrength');
        const contrast = this.findIndex('contrast');
        const brightness = this.findIndex('brightness');

        // buffer for compute
        const colorBuffer = this.device.createTexture({
            size: {width,height},
            format: 'rgba8unorm',
            usage: GPUTextureUsage.COPY_DST | GPUTextureUsage.COPY_SRC |
             GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING,
        });

        // CONFIG UNIFORMS
        // edge threshold
        const usage = GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST;
        const threshBuffer = this.device.createBuffer({size: 4, usage: usage});
        this.device.queue.writeBuffer(threshBuffer, 0, new Float32Array([<number>this.config[edgeThreshold].value]))

        // resolution buffer
        const resBuffer = this.device.createBuffer({size:8, usage: usage});
        this.device.queue.writeBuffer(resBuffer, 0, new Float32Array([width, height]));

        // colors
        const posColorBuffer = this.device.createBuffer({size: 12,usage: usage});
        this.device.queue.writeBuffer(posColorBuffer, 0, new Float32Array(<number[]>this.hexToRgb(<string>this.config[colorAscii].value)));

        const negColorBuffer = this.device.createBuffer({size: 12,usage: usage});
        this.device.queue.writeBuffer(negColorBuffer, 0, new Float32Array(<number[]>this.hexToRgb(<string>this.config[colorBg].value)));

        // DoG strength
        const dogStrengthBuffer = this.device.createBuffer({size: 4,usage: usage});
        this.device.queue.writeBuffer(dogStrengthBuffer, 0, new Float32Array([<number>this.config[dogStrength].value]));

        // contrast
        const contrastBuffer = this.device.createBuffer({size: 4,usage: usage});
        this.device.queue.writeBuffer(contrastBuffer, 0, new Float32Array([<number>this.config[contrast].value]));

        // DoG brightness
        const brightnessBuffer = this.device.createBuffer({size: 4,usage: usage});
        this.device.queue.writeBuffer(brightnessBuffer, 0, new Float32Array([<number>this.config[brightness].value]));

        // bitmaps
        const bitmap = this.createBitmap(bitmapVer5_Data);
        const bitmapEdge = this.createBitmap(bitmapEdgeVer1_Data);

        // DoG
        const dogEntries = [
            {binding: 0, resource: this.sampler},
            {binding: 1, resource: this.texture.createView()},
            {binding: 2, resource: { buffer: resBuffer }},
            {binding: 3, resource: { buffer: dogStrengthBuffer }},
            {binding: 4, resource: { buffer: contrastBuffer }},
            {binding: 5, resource: { buffer: brightnessBuffer }},
        ];

        // SOBEL
        const sobelEntries = [
            {binding: 0, resource: this.sampler},
            {binding: 1, resource: this.texture.createView()},
            {binding: 2, resource: { buffer: resBuffer }},
        ];

        const sobelShaderModule = this.device.createShaderModule({
            label: 'sobel filter',
            code: asciiSobelCode
        })

        const sobelPipeline = this.device.createRenderPipeline({
            layout: 'auto',
            vertex: {
                module: sobelShaderModule,
            },
            fragment: {
                module: sobelShaderModule,
                targets: [{format: this.canvasFormat}],
            }
        });

        // DOWNSCALE
        const downscaleShaderModule = this.device.createShaderModule({
            label: 'downscale',
            code: asciiDownscaleCode,
        });

        const downscalePipeline = this.device.createComputePipeline({
            layout: 'auto',
            compute: {
                module: downscaleShaderModule,
                entryPoint: 'main',
            },
        });

        const downscaleEntries = [
            {binding: 0, resource: colorBuffer.createView()},
            {binding: 1, resource: this.texture.createView()},
            {binding: 2, resource: { buffer: threshBuffer }},
        ];

        // FINALIZE
        
        // calculate edges bool (enum)
        const calculateEdgeBoolBuffer = this.device.createBuffer({
            size: 4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });
        this.device.queue.writeBuffer(calculateEdgeBoolBuffer, 0, new Float32Array([1]));

        const finalizeModule = this.device.createShaderModule({
            label: 'ascii finalize',
            code: asciiConvertCode,
        })

        const finalizePipeline = this.device.createRenderPipeline({
            layout: 'auto',
            vertex: {
                module: finalizeModule,
            },
            fragment: {
                module: finalizeModule,
                targets: [{format: this.canvasFormat}],
            },
        });
        const finalizeEntries = [
            {binding: 0, resource: this.sampler},
            {binding: 1, resource: colorBuffer.createView()},
            {binding: 2, resource: bitmap.createView()},
            {binding: 3, resource: bitmapEdge.createView()},
            {binding: 4, resource: this.texture.createView()},
            {binding: 5, resource: {buffer: resBuffer}},
            {binding: 6, resource: {buffer: calculateEdgeBoolBuffer}},
            {binding: 7, resource: {buffer: posColorBuffer}},
            {binding: 8, resource: {buffer: negColorBuffer}},
            {binding: 9, resource: { buffer: contrastBuffer }},
            {binding: 10, resource: { buffer: brightnessBuffer }},
        ];

        const edgePasses: ShaderProgram[] = [
            {
                // processes and renders the edges of the image
                label: 'DoG',
                passType: 'render',
                pipeline: this.pipeline,
                entries: dogEntries,
            },
            {
                // computes and renders the edge normals
                label: 'sobel',
                passType: 'render',
                pipeline: sobelPipeline,
                entries: sobelEntries,
            },
            {
                // computes the average direction of the normals (8x8)
                label: 'downscale',
                passType: 'compute',
                pipeline: downscalePipeline,
                entries: downscaleEntries,
                workgroupSize: 8,
            },
        ]

        const passes: ShaderProgram[] = [
            {
                // converts edge calculations into ascii edges and converts image luminance into ascii
                label: 'ascii finalize',
                passType: 'render',
                pipeline: finalizePipeline,
                entries: finalizeEntries,
            },
        ];

        if(this.config[drawEdges].value === true) {
            passes.unshift(edgePasses[0], edgePasses[1], edgePasses[2]);
        }

        const instructions: ProgramInstructions = {
            label: 'ASCII shader instructions',
            passes,
        }

        return instructions;
    }
}