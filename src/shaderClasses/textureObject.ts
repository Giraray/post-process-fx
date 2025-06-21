import { ShaderObject } from './shaderObject'
import {NumberConfig, EnumConfig, BoolConfig, RangeConfig, ObjectBase} from './objectBase';

interface Size {
    width: number;
    height: number;
}

export abstract class TextureObject extends ObjectBase {
    shader: ShaderObject | null;
    dataUrl: string;
    preferredContainerSize: Size;
    container: HTMLDivElement;
    static: boolean;

    pipeline: GPURenderPipeline;
    bindGroup: GPUBindGroup

    constructor(device: GPUDevice, canvasFormat: GPUTextureFormat, context: GPUCanvasContext) {
        super(device, canvasFormat);
        this.context = context;
        this.objectType = 'texture';

        this.container = <HTMLDivElement>document.getElementById('imgDisp');
        this.preferredContainerSize = {width: this.container.clientWidth, height: this.container.clientHeight};
    }

    /**
     * Sets or removes a texture's active shader.
     * @param shader Removes and deactivates current shaders if null
     */
    public setShader(shader: ShaderObject | null) {
        const shaderConfigs = document.getElementById('shaderOptions');
        const shaderTitle = document.getElementById('shaderTitle');

        // if texture already has a shader: deactive it
        if(this.shader != undefined) {
            clearInterval(this.shader.timeout);
        }

        // if current shader is reselected: negate it. Also clear out shader config HTML
        if(this.shader != undefined && shader != null && shader.constructor.name === this.shader.constructor.name) {
            shader = null;
            shaderConfigs.innerHTML = '';
            shaderTitle.innerHTML = '';
        }

        this.shader = shader;
    }

    abstract updateTexture(): void;

    setTimer() {
        clearInterval(this.timeout);
        this.timeout = setInterval(() => {

            const now = Date.now();
            const delta = this.lastUpdate - now;
            this.lastUpdate = now;
            this.time -= delta/1000;

            requestAnimationFrame(this.render.bind(this));
        }, 1000 / <number>this.config[this.findIndex('fps')].value);
    }

    public render(): void {
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

        // draw the pass
        const pass = textureEncoder.beginRenderPass({
            label: 'defaultImg pass',
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

        // submit pass
        this.device.queue.submit([textureEncoder.finish()]);

        // if texture is animatable then trigger render() on timer
        if(this.config[this.findIndex('animate')] != undefined && this.config[this.findIndex('animate')].value === true) {
            this.setTimer();
            this.static = false;
        }
        else {
            this.static = true;
        }

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
                finalRender: true,
            }

            // pass the texture output from this texture to the shader
            shader.texture = textureOutput;
            
            // register this textureObject as the shader's parentTexture once
            if(shader.parentTexture == undefined) {
                shader.parentTexture = this;
            }

            // whether or not the shader should be rendered mutliple times - based on if the shader is static or not
            if(this.shader.static == true) {
                shader.render(renderOptions);
            }
            else{
                shader.renderOnTimer(renderOptions);
            }
        }

        this.dataUrl = (<HTMLCanvasElement>this.context.canvas).toDataURL('image/png');
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