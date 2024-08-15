A silly website to showcase silly shaders

todo (high priority stuff):
- Animated textures do not animate when a shader is applied
- Shaders should persist upon texture change when it has not been deselected

bugs and low priority stuff:
- Application of shaders persists upon initTexture() when the shader has been removed from texture.
- Texture is reset and wonky when a shader is selected. initConfig() should differentiate between shader and texture config.
- Insert image needs error handling.
- ImgTexture needs Resize option.
- PerlinTexture should have billowRidge style.
- Texture config interfaces are not needed, and config values are weird in the constructor.
- Clean up render() in ShaderObject.

big picture plans:
- whole ass UI overhaul

other wonderful ideas:
- Config HTML should be automatically generated and maintained.
