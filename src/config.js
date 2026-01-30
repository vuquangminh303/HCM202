/**
 * Configuration for Ho Chi Minh Thought Globe Visualization
 * react-globe: https://github.com/chrisrzhou/react-globe
 */
export default {
  keyword: 'Hành trình Cách mạng của Chủ tịch Hồ Chí Minh',
  globeBackgroundTexture:
    'https://raw.githubusercontent.com/chrisrzhou/react-globe/main/textures/background.png',
  globeCloudsTexture:
    'https://raw.githubusercontent.com/chrisrzhou/react-globe/main/textures/clouds.png',
  globeTexture:
    'https://raw.githubusercontent.com/chrisrzhou/react-globe/main/textures/globe.jpg',
  options: {
    ambientLightColor: '#6ab7ff',
    ambientLightIntensity: 1.2,
    cameraAutoRotateSpeed: 0.01,
    cameraRotateSpeed: 0.2,
    enableCameraZoom: true,
    enableDefocus: false,
    focusAnimationDuration: 1000,
    globeCloudsOpacity: 0.15,
    globeGlowCoefficient: 0.15,
    globeGlowColor: '#6ab7ff',
    globeGlowPower: 6,
    globeGlowRadiusScale: 0.25,
    pointLightIntensity: 1,
    pointLightPositionRadiusScales: [-1, 1.5, -2.5],
    minCameraDistance: 1.5,
    maxCameraDistance: 5,
  },
};
