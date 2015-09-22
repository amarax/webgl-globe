uniform color vec3;
uniform opacity float;

void main() {
  gl_FragColor = vec4( color, opacity );
}
