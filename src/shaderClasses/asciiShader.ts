import asciiDogCode from '../assets/shaders/ascii/asciiDoG.wgsl?raw';
import asciiSobelCode from '../assets/shaders/ascii/asciiSobel.wgsl?raw';
import asciiDownscaleCode from '../assets/shaders/ascii/asciiDownscale.wgsl?raw';
import asciiConvertCode from '../assets/shaders/ascii/asciiConvert.wgsl?raw';
import {ShaderObject, ProgramInstructions, ShaderProgram} from './shaderObject';

import {NumberConfig, EnumConfig, BoolConfig, RangeConfig, StringConfig} from './objectBase';

import {Bitmap, testBitmap, bitmapEdgeVer1_Data, bitmapVer4_Data, bitmapVer5_Data } from '../assets/bitmaps/bitmaps';

export default class AsciiShader extends ShaderObject {
    // config
    drawEdges: BoolConfig;
    edgeThreshold: NumberConfig;
    bitmapSet: NumberConfig;
    colorAscii: NumberConfig; // todo vec3 maybe?
    colorBg: NumberConfig;

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

        this.config = this.createConfig();
        this.drawEdges = <BoolConfig>this.config[0];
        this.edgeThreshold = <NumberConfig>this.config[1];
        this.bitmapSet = <NumberConfig>this.config[2];
        this.colorAscii = <NumberConfig>this.config[3];
        this.colorBg = <NumberConfig>this.config[4];
        this.initTextureConfig(this.config, this);
    }

    handleDrawEdges(target: HTMLInputElement, origin: AsciiShader, item: BoolConfig) {
        let value = target.checked === true ? true : false;
        item.value = value;

        origin.render({
            size: origin.size,
            canvasFormat: origin.canvasFormat,
            context: origin.context,
        });
    }

    handleNumber(target: HTMLInputElement, origin: AsciiShader, item: NumberConfig) {
        let value = parseFloat(target.value);
        if(isNaN(value))
            value = 0;
        item.value = value;

        origin.render({
            size: origin.size,
            canvasFormat: origin.canvasFormat,
            context: origin.context,
        });
    }

    handleString(target: HTMLInputElement, origin: AsciiShader, item: StringConfig) {
        let value = target.value;
        item.value = value;

        origin.render({
            size: origin.size,
            canvasFormat: origin.canvasFormat,
            context: origin.context,
        });
        console.log(item)
    }

    createConfig(): (NumberConfig | BoolConfig)[] {
        const drawEdges: BoolConfig = {
            type: 'bool',
            label: 'Draw edges',
            id: 'drawEdges',
            title: 'Draws ASCII edges - High performance impact',

            default: true,
            value: true,

            event: this.handleDrawEdges,
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

            event: this.handleNumber,
        }

        const bitmapSet: StringConfig = { // todo stringConfig. Requires an in depth user explanation
            type: 'string',
            label: 'Bitmap set',
            id: 'bitmapSet',
            title: 'ASCII bitmap set',
            
            default: '',
            value: '',

            event: this.handleString,
        }

        const colorAscii: NumberConfig = { // todo colorConfig
            type: 'number',
            label: 'Color 1',
            id: 'colorAscii',
            title: 'ASCII color',
            
            default: 0, // white
            value: 0,

            event: this.handleColorAscii,
        }

        const colorBg: NumberConfig = { // todo colorConfig
            type: 'number',
            label: 'Color 2',
            id: 'colorBg',
            title: 'Background color',
            
            default: 0, // black
            value: 0,

            event: this.handleColorBg,
        }

        return [drawEdges, edgeThreshold, bitmapSet, colorAscii, colorBg];
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
        // buffer for compute
        const colorBuffer = this.device.createTexture({
            size: {width,height},
            format: 'rgba8unorm',
            usage: GPUTextureUsage.COPY_DST | GPUTextureUsage.COPY_SRC |
             GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING,
        });

        // CONFIG UNIFORMS
        // edge threshold
        const uUsage = GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST;
        const threshBuffer = this.device.createBuffer({
            size: 4,
            usage: uUsage
        });
        this.device.queue.writeBuffer(threshBuffer, 0, new Float32Array([<number>this.edgeThreshold.value]))

        // resolution buffer
        const resBuffer = this.device.createBuffer({
            size:8,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });
        this.device.queue.writeBuffer(resBuffer, 0, new Float32Array([width, height]));

        // bitmaps
        const bitmap = this.createBitmap(bitmapVer5_Data);
        const bitmapEdge = this.createBitmap(bitmapEdgeVer1_Data);

        // DoG
        const entries = [
            {binding: 0, resource: this.sampler},
            {binding: 1, resource: this.texture.createView()},
            {binding: 2, resource: { buffer: resBuffer }},
        ];

        // SOBEL
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
        ];

        const edgePasses: ShaderProgram[] = [
            {
                // processes and renders the edges of the image
                label: 'DoG',
                passType: 'render',
                pipeline: this.pipeline,
                entries: entries,
            },
            {
                // computes and renders the edge normals
                label: 'sobel',
                passType: 'render',
                pipeline: sobelPipeline,
                entries: entries,
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

        if(this.drawEdges.value === true) {
            passes.unshift(edgePasses[0], edgePasses[1], edgePasses[2]);
        }

        const instructions: ProgramInstructions = {
            label: 'ASCII shader instructions',
            passes,
        }

        return instructions;
    }
}