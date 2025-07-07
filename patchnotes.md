10 - 07.07.25
- Dynamic ASCII bitmap sets are now ready! Cleaned up lots of code.

9 - 21.06.25
- Moved brightness and contrast from ASCII shader to Img texture.

8 - 18.06.25
- Added bitmap set config for ASCII shader that dynamically adjusts the render resolution based on bitmap size. Still need to finish bitmap characters and clean up bitmaps.ts.
- Added a try-catch for the GPU device, since an error might be cast if Vulkan is not enabled on the browser for linux users.

7 - 13.06.25
- Added a try-catch for the GPU adapter. Changed the readme and moved Todo's to own txt file. Expanded upon bitmaps.

6 - 23.02.25
- Added LCh color space to the Cel shader as a config which addresses non-perceptually uniform color palette gradients - an artefact from using HSL. In fact, I might just remove the HSL option entirely since it sometimes looks like utter ass.

5 - 29.01.25
- Adjusting cel shader color quantization no longer generates a new palette. Palettes are only generated with the button config

4 - 28.01.25
- Fixed dataUrl not updating when shader is adjusted, which previously resulted in the canvas data not updating until the texture is changed and prevent updated image downloads
- Abstracted render() for TextureObjects, massively reducing boilerplate code in existing and future texture objects.
- New button config, which does not take input but rather triggers an event
- Button config for cel shader which generates a random palette without needing to adjust color quantization

3 - 31.12.24
- Split DoG filter into DoG Cel shader and DoG filter (the styles were too different)
- Added random palette generation to Cel shader

2 - 30.12.24
- Added Difference of Gaussians filter (in progress)
- Started implementing metadata for all shaders and textures (should get worked into its own system once its fleshed out)
- Tweaked some stuff in other shaders
- Added some functions to cut boilerplate code
- New config loading system implemented for textures

1 - 20.12.24
- Refactored config-loading system for shader objects (for better or for worse)
- Fixed img resize working one-way only
- Improved CSS for option window titles

Patchnotes started 20.12.24