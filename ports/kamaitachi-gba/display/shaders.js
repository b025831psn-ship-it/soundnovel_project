export const VERTEX_SHADER = `
attribute vec2 a_position;
void main() { gl_Position = vec4(a_position, 0.0, 1.0); }
`;

export const HANDHELD_25X_FRAGMENT_SHADER = `
precision highp float;
uniform sampler2D u_frame;
uniform vec2 u_sourceSize;
uniform vec2 u_outputSize;

vec4 sourcePixel(vec2 pixel) {
  return texture2D(u_frame, (pixel + 0.5) / u_sourceSize);
}

float darkness(vec4 color) { return color.r + color.g + color.b; }
vec4 darker2(vec4 first, vec4 second) {
  return darkness(second) < darkness(first) ? second : first;
}

void main() {
  vec2 topOutput = vec2(gl_FragCoord.x - 0.5, u_outputSize.y - gl_FragCoord.y - 0.5);
  vec2 cell = mod(topOutput, 5.0);
  vec2 origin = floor(topOutput / 5.0) * 2.0;
  vec4 a = sourcePixel(origin);
  vec4 b = sourcePixel(origin + vec2(1.0, 0.0));
  vec4 c = sourcePixel(origin + vec2(0.0, 1.0));
  vec4 d = sourcePixel(origin + vec2(1.0, 1.0));
  bool middleX = cell.x > 1.5 && cell.x < 2.5;
  bool middleY = cell.y > 1.5 && cell.y < 2.5;
  if (middleX && middleY) gl_FragColor = darker2(darker2(a, b), darker2(c, d));
  else if (middleX) gl_FragColor = cell.y < 2.0 ? darker2(a, b) : darker2(c, d);
  else if (middleY) gl_FragColor = cell.x < 2.0 ? darker2(a, c) : darker2(b, d);
  else gl_FragColor = cell.y < 2.0 ? (cell.x < 2.0 ? a : b) : (cell.x < 2.0 ? c : d);
}
`;
