// @orca-ui/three — accessible, theme-aware WebGL components. Requires `three` (peer) and @orca-ui/core styles.
export { Scene3D, Globe3D, ParticlesField, FloatingShapes, ModelViewer, Chart3D } from './components';
export type {
  Scene3DProps,
  Globe3DProps,
  GlobeMarker,
  GlobeArc,
  GeoPoint,
  ParticlesFieldProps,
  FloatingShapesProps,
  ModelViewerProps,
  Chart3DProps,
  Chart3DDatum,
} from './components';
export { useThreeScene, readThemeColors, isWebGLAvailable, prefersReducedMotion, disposeObject } from './core';
export type {
  SceneContext,
  SceneHandle,
  SceneSetup,
  SetupResult,
  ThemeColors,
  CameraOptions,
  UseThreeSceneOptions,
  ThreeStatus,
} from './core';
