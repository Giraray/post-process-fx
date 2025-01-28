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