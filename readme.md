A silly website to showcase silly shaders

todo:
- ASCII shader (30% done)


bugs and low priority stuff:
- Application of shaders persists upon initTexture() when the shader has been removed from texture.
- Texture is reset and wonky when a shader is selected. initConfig() should differentiate between shader and texture config.
- Insert image needs error handling.
- ImgTexture needs Resize option.
- PerlinTexture should have billowRidge style.
- Texture config interfaces are not needed, and config values are weird in the constructor.

big picture plans:
- whole ass UI overhaul

other wonderful ideas:
- Config HTML should be automatically generated and maintained.