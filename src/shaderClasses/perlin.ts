import perlinCode from '../assets/shaders/perlinNoise.wgsl?raw';
import { perlinTextureConfig } from '../createConfig';
import ShaderObject from './shaderObject'
import TextureObject from './textureObject';

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
    speed?: number;
}

type StyleOptions =
    | 'billowRidge'
    | 'natural'
    | 'normalized';

interface PerlinOptions {
    config?: PerlinConfig;
    seed: number;
    size: Size;
}

/**
 * Creates an object containing a `GPURenderPipeline` and a `GPUBindGroup` for 
 * a perlin noise texture.
 */
export class PerlinTexture extends TextureObject implements PerlinOptions {
    time: number = 0;
    config?: PerlinConfig;
    size: Size;
    seed: number;

    pipeline: GPURenderPipeline;
    bindGroup: GPUBindGroup;

    shaders: Array<ShaderObject>;
    timeout: ReturnType<typeof setTimeout>;
    dataUrl: string;

    lastUpdate: number;

    constructor(device: GPUDevice, canvasFormat: GPUTextureFormat, context: GPUCanvasContext, options: PerlinOptions) {
        super(device, canvasFormat, context);
        this.size = options.size;
        this.seed = options.seed;
        this.config = options.config ? options.config : undefined;
        this.lastUpdate = Date.now();

        if(!this.config.animate)
            this.config.animate = false;
        if(!this.config.intensity)
            this.config.intensity = 1;
        if(!this.config.gridSize)
            this.config.gridSize = 2;
        if(!this.config.speed)
            this.config.speed = 1;

        // generate user config
        document.getElementById('textureOptions').innerHTML = perlinTextureConfig;

        // EVENT LISTENERS
        const config = this.config;
        const self = this;
        const intensityElm = <HTMLInputElement>document.getElementById('intensity');
        const styleElm = <HTMLSelectElement>document.getElementById('style');
        const gridSizeElm = <HTMLInputElement>document.getElementById('gridSize');
        const animateElm = <HTMLInputElement>document.getElementById('animate');
        const speedElm = <HTMLInputElement>document.getElementById('speed');

        // intensity
        intensityElm.addEventListener('change', function(event) {
            let value = parseFloat((event.target as HTMLInputElement).value);
            if(isNaN(value))
                value = 0;
            config.intensity = value;

            clearTimeout(self.timeout);
            self.renderToCanvas();
        })

        // style
        styleElm.addEventListener('change', function(event) {
            let value = (event.target as HTMLInputElement).value;
            config.style = value as StyleOptions;

            clearTimeout(self.timeout);
            self.renderToCanvas();
        })

        // gridSize
        gridSizeElm.addEventListener('change', function(event) {
            let value = parseFloat((event.target as HTMLInputElement).value);
            if(isNaN(value))
                value = 0;
            config.gridSize = value;

            clearTimeout(self.timeout);
            self.renderToCanvas();
        })

        // animate
        animateElm.addEventListener('change', function(event) {
            let value = (event.target as HTMLInputElement).checked === true ? true : false;
            config.animate = value;

            clearTimeout(self.timeout);
            self.renderToCanvas();
        })

        speedElm.addEventListener('change', function(event) {
            let value = parseFloat((event.target as HTMLInputElement).value);
            if(isNaN(value))
                value = 0;
            config.speed = value;

            clearTimeout(self.timeout);
            self.renderToCanvas();
        })
    }

    setTimer() {
        this.timeout = setTimeout(() => {

            const now = Date.now();
            const delta = this.lastUpdate - now;
            this.lastUpdate = now;
            this.time -= delta/100;

            requestAnimationFrame(this.renderToCanvas.bind(this));
        }, 1000 / 60);
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

        // style
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

        // speed
        const speedBuffer = device.createBuffer({
            size: 4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });
        device.queue.writeBuffer(speedBuffer, 0, new Float32Array([this.config.speed]));

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
            ],
        });
    }

    public resizeCanvas(canvas: HTMLCanvasElement) {
        canvas.width = this.size.width;
        canvas.height = this.size.height;

        canvas.style.width = this.size.width + 'px';
        canvas.style.height = this.size.height + 'px';
    }

    public renderToCanvas() {
        // render texture
        this.createTexture();

        // create renderTarget if a shader is to be applied; otherwise use context
        let textureOutput: GPUTexture;
        if(this.shaders.length > 0) {

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
        if(this.shaders.length > 0) {
            const shader = this.shaders[0];
            shader.renderTarget = textureOutput;
        
            const shaderEncoder = this.device.createCommandEncoder({
                label: 'shader encoder',
            });

            const bindGroup = this.device.createBindGroup({
                layout: shader.pipeline.getBindGroupLayout(0),
                entries: shader.createBindings(this.time, {width: this.size.width, height: this.size.height}),
            });

            const shaderPass = shaderEncoder.beginRenderPass({
                colorAttachments: [{
                    view: this.context.getCurrentTexture().createView(),
                    clearValue: [0,0,0,1],
                    loadOp: 'clear',
                    storeOp: 'store',
                }],
            });
            
            shaderPass.setPipeline(shader.pipeline);
            shaderPass.setBindGroup(0, bindGroup);
            shaderPass.draw(6);
            shaderPass.end();
            
            this.device.queue.submit([shaderEncoder.finish()]);
        }

        this.dataUrl = (<HTMLCanvasElement>this.context.canvas).toDataURL('image/png');

        if(this.config.animate === true) {
            this.setTimer();
        }
    }
}