### A silly website to showcase silly shaders

>[!NOTE]
>After installing dependencies, run `npx vite` to serve locally

This project provides a variety of base image textures and effects in your graphics accelerated browser. It utilizes the W3C [WebGPU](https://github.com/gpuweb/gpuweb) API to run shaders on the web. The project is still under development and is mostly exploratory in nature, serving as my conduit for learning the computer graphics paradigm.

>[!NOTE]
>WebGPU is new and still experimental. It should be compatible with most chromium browsers such as Chrome, Microsoft Edge and Opera (though usually requires enabling WebGPU browser flags). It is also currently compatible with Firefox Nightly. Make sure to enable your browser's graphics/hardware acceleration option. For Linux users, Vulkan might be required as the browser's graphics backend, which may be available in the browser flags.