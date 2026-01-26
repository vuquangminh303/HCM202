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
    'https://raw.githubusercontent.com/chrisrzhou/react-globe/main/textures/globe_dark.jpg',
  options: {
    ambientLightColor: '#4a90e2',
    ambientLightIntensity: 1,
    cameraAutoRotateSpeed: 0.01,
    cameraRotateSpeed: 0.2,
    enableCameraZoom: false,
    enableDefocus: false,
    focusAnimationDuration: 1000,
    globeCloudsOpacity: 0.1,
    globeGlowCoefficient: 0.1,
    globeGlowColor: '#4a90e2',
    globeGlowPower: 5,
    globeGlowRadiusScale: 0.2,
    pointLightIntensity: 3,
    pointLightPositionRadiusScales: [-1, 1.5, -2.5],
  },
};
