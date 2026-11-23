const{getDefaultConfig}=require('expo/metro-config');const path=require('path');
const config=getDefaultConfig(__dirname);config.resolver.assetExts.push('html');
// Metro's classic script bundle cannot contain Zustand's ESM import.meta.
// Resolve its supported CommonJS builds on both web and native.
const zustandRoot=path.dirname(require.resolve('zustand/package.json'));
const commonjs={'zustand':'index.js','zustand/vanilla':'vanilla.js','zustand/middleware':'middleware.js'};
config.resolver.resolveRequest=(context,moduleName,platform)=>commonjs[moduleName]?{type:'sourceFile',filePath:path.join(zustandRoot,commonjs[moduleName])}:context.resolveRequest(context,moduleName,platform);
module.exports=config;
