const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// quitamos 'svg' de assetExts para que no trate los SVG como imágenes
config.resolver.assetExts = config.resolver.assetExts.filter(ext => ext !== 'svg');
// añadimos 'svg' a sourceExts para que sean transformados
config.resolver.sourceExts = [...config.resolver.sourceExts, 'svg'];
// le decimos que use el transformer
config.transformer.babelTransformerPath = require.resolve('react-native-svg-transformer');

module.exports = config;
