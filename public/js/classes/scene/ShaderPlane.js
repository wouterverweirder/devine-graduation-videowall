import * as THREE from '../../three.js/build/three.module.js';
import { VisualBase } from "./VisualBase.js";

class ShaderPlane extends VisualBase {
  async createMaterial() {

    console.log(this.props.projects);

    const vertextShaderSource = `
      varying vec2 vUv; 

      void main() {
        vUv = uv;
        vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * modelViewPosition; 
      }
    `;

    const fragmentShaderSource = `
      varying vec2 vUv;

      uniform sampler2D textureA;
      uniform vec2 textureAScale;
      uniform vec2 textureATranslate;
      uniform vec2 textureACrop;

      uniform sampler2D textureB;
      uniform vec2 textureBScale;
      uniform vec2 textureBTranslate;
      uniform vec2 textureBCrop;

      vec4 cropImage(sampler2D img, vec2 texCoord) {
        if (texCoord.x < 0.0 || texCoord.x > 1.0 ||texCoord.y < 0.0 || texCoord.y > 1.0) {
          return vec4(0.0);
        }
        return texture2D(img, texCoord);
      }

      void main() {

        vec2 coordA = ((vUv - textureATranslate) * textureAScale);
        vec4 colorA = cropImage(textureA, coordA);

        if (colorA.a > 0.0) {
          gl_FragColor = colorA;
          return;
        }

        vec2 coordB = ((vUv - textureBTranslate) * textureBScale);
        vec4 colorB = cropImage(textureB, coordB);

        gl_FragColor = colorA + colorB;
      }
    `;

    const normalizedTextureSize = [
      this.props.textureSize.x / Math.min(this.props.textureSize.x, this.props.textureSize.y),
      this.props.textureSize.y / Math.min(this.props.textureSize.x, this.props.textureSize.y)
    ];

    // what's the space we want to give texture A
    // texture target bounds are within plane space
    const textureATargetBounds = [
      0.0, 0.0,
      0.5, 1.0
    ];

    const textureAScale = [
      this.props.textureSize.x / Math.max(textureATargetBounds[2] * this.props.textureSize.x, textureATargetBounds[3] * this.props.textureSize.y),
      this.props.textureSize.y / Math.max(textureATargetBounds[2] * this.props.textureSize.x, textureATargetBounds[3] * this.props.textureSize.y)
    ];
    const textureATranslate = [0.0, 0.0];

    const textureBScale = [normalizedTextureSize[0], normalizedTextureSize[1]];
    const textureBTranslate = [0.5, 0.0];

    const uniforms = {
      textureA: { value: new THREE.TextureLoader().load( this.props.projects[0].profilePicture.url ) },
      textureAScale: { value: textureAScale },
      textureATranslate: { value: textureATranslate },
      textureB: { value: new THREE.TextureLoader().load( this.props.projects[1].profilePicture.url ) },
      textureBScale: { value: textureBScale },
      textureBTranslate: { value: textureBTranslate },
    };

    const material =  new THREE.ShaderMaterial({
      uniforms: uniforms,
      fragmentShader: fragmentShaderSource,
      vertexShader: vertextShaderSource,
    });

    this.time = 0;

    return material;
  }

  render() {
    // this.time++;
    // this.material.uniforms.textureATranslate.value[0] = THREE.MathUtils.mapLinear(Math.sin(this.time / 100), -1, 1, 0, 1);
    // console.log(this.material.uniforms.textureATranslate.value[0]);
  }

  dispose() {
    super.dispose();
  }
}

export { ShaderPlane }