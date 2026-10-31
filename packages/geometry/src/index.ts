export { parsePath, serializePath, pathBounds } from "./path.js";
export type { PathSegment, ParsedPath, Bounds } from "./path.js";
export {
  evalCubic, evalQuadratic,
  cubicSegmentBounds, quadraticSegmentBounds,
  cubicSegmentLength, quadraticSegmentLength,
  measurePath, pointAtLength, pointOnSegment,
  reversePath, transformPath,
} from "./bezier.js";
export type { Point, PathMeasurement } from "./bezier.js";

export {
  pointInPolygon, polygonArea, ensureCCW,
  simplifyPolygon, booleanPolygons,
  pathToPolygons, polygonsToPathString,
  pathBoolean,
} from "./boolean.js";
export type { BooleanOp, BooleanOptions } from "./boolean.js";

export {
  analyzeCurveContinuity,
  analyzeOpticalBalance,
  evaluateVisualQuality,
} from "./quality.js";
export type {
  CurveContinuityReport,
  OpticalBalanceReport,
  VisualQualityReport,
} from "./quality.js";

export {
  vec3, addVec3, subVec3, dotVec3, crossVec3, normalizeVec3, rotateVec3,
  projectPoint, projectFace, render3DFaces,
  create3DBox, create3DCylinder, create3DPlane,
} from "./threed.js";
export type {
  Vector3, EulerAngles, ProjectionType, CameraOptions, LightSource,
  Face3D, ProjectedFace, BoxOptions, CylinderOptions, Plane3DOptions,
} from "./threed.js";

export {
  composeSlideSvg, composeWebHeroSvg,
} from "./templates.js";
export type {
  SlideOptions, WebHeroOptions, MetricCardOptions,
} from "./templates.js";

export {
  generateDonutChartSvg,
  generateSmoothAreaChartSvg,
  generateBarChartSvg,
  generateGaugeMeterSvg,
} from "./charts.js";
export type {
  ChartDatum, DonutChartOptions, SmoothAreaOptions, BarChartOptions, GaugeOptions,
} from "./charts.js";
