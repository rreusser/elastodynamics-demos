// This file will be included as an inline script tag by index.html. It
// also gets wrapped in a `window.onload = function() { ... }` wrapper
// so that the whole file doesn't need to be indented. This means things
// included in the bundle are available here.

'use strict';

const regl = window._regl = window.regl({
  extensions: ['oes_standard_derivatives'],
  optionalExtensions: ['oes_element_index_uint']
});

const scalar = cwise({
  args: [{blockIndices: -1}],
  body: function (A) {
    A[0] = A[0] * 4 - 2;
    A[1] = A[1] * 2 - 1;
    A[2] = A[2] * 2 - 1;
  }
})

const scale = A => {
  scalar(A);
  return A;
}

var n = [2, 11, 41];

const faces = window.f = [
  [[u => [u, 0, 0], u => [u, 1, 0]], [v => [0, v, 0], v => [1, v, 0]]],
  [[u => [u, 0, 1], u => [u, 1, 1]], [v => [0, v, 1], v => [1, v, 1]]],
  [[u => [u, 0, 0], u => [u, 0, 1]], [w => [0, 0, w], w => [1, 0, w]]],
  [[u => [u, 1, 0], u => [u, 1, 1]], [w => [0, 1, w], w => [1, 1, w]]],
  [[v => [0, v, 0], v => [0, v, 0]], [w => [0, 0, w], w => [0, 1, w]]],
  [[v => [1, v, 0], v => [1, v, 0]], [w => [1, 0, w], w => [1, 1, w]]],
]
  .map((f, i) => tfi(zeros(n.filter((j, k) => k !== Math.floor(i / 2)).concat([3]), 'float32'), f))
  .map(scale)
  .map(createFace);

function byteSize (arr) {
  if (arr.constructor === Float32Array) {
    return 4;
  } else {
    throw new Error('Unexpected array type: ' + String(arr.constructor));
  }
}

function createFace (A, dir) {
  var dir = Math.floor(dir / 2);
  var dim = A.dimension;
  var a, b, c, d, i, j;
  var l = A.shape[0];
  var m = A.shape[1];
  var o = A.offset;
  var si = A.stride[0];
  var sj = A.stride[1];
  var gridCoord = [];

  var faces = [];
  for (j = 0; j < m - 1; j++) {
    for (i = 0; i < l - 1; i++) {
      // c d
      // a b
      a = o + si * i + sj * j;
      b = a + si;
      c = a + sj;
      d = b + sj;

      faces.push(a, b, c);
      faces.push(d, c, b);
    }
  }

  var f1 = 20 / (A.shape[0] - 1);
  var f2 = 20 / (A.shape[1] - 1);
  for (j = 0; j < m; j++) {
    for (i = 0; i < l; i++) {
      a = o + si * i + sj * j;
      gridCoord[a] = i * f1;
      gridCoord[a + 1] = j * f2;
      gridCoord[a + 2] = 0;
    }
  }

  return {
    array: A,
    faces: faces,
    buffer: A.data,
    count: faces.length,
    color: [1, 0, 0, 0.5],
    byteSize: byteSize(A.data),
    gridCoord: new Float32Array(gridCoord)
  };
}

const camera = createCamera(regl, {
  center: [0, 0, 0],
  phi: Math.PI * 0.1,
  theta: Math.PI * 0.25,
  distance: 5
});

const drawFaces = regl({
  frag: `
    #extension GL_OES_standard_derivatives : enable

    precision mediump float;
    varying vec3 vBC;
    uniform vec4 color;

    float edgeFactor () {
      vec3 d = fwidth(vBC);
      vec3 a3 = smoothstep(vec3(0.0), 1.5 * d, 0.5 - abs(mod(vBC, 1.0) - 0.5));
      return min(a3.x, a3.y);
    }

    void main () {
      float ef = edgeFactor();
      gl_FragColor = vec4(mix(vec3(0.0), vec3(1.0), ef), 1.0);
    }`,
  vert: `
    precision mediump float;
    varying vec3 vBC;
    uniform mat4 projection, view;
    uniform float time;
    float omega = 5.0;
    attribute vec3 position, gridCoord;
    void main () {
      vBC = gridCoord;
      gl_Position = projection * view * vec4(
        position.x + 0.05 * sin(4.0 * position.x - omega * time + 3.1415926 * 0.5) * exp((position.y - 0.5) * 2.0),
        position.y + 0.025 * sin(4.0 * position.x - omega * time) * exp((position.y - 0.5) * 2.0),
        position.z,
        1.0
      );
    }`,
  primitive: 'triangles',
  attributes: {
    position: {
      buffer: regl.prop('buffer'),
      stride: regl.prop('byteSize'),
    },
    gridCoord: {
      buffer: regl.prop('gridCoord'),
      stride: 4
    }
  },
  uniforms: {
    color: regl.prop('color'),
    time: regl.context('time')
  },
  count: regl.prop('count'),
  elements: regl.prop('faces')
})

regl.frame(({tick}) => {
  //if (tick % 30 !== 0) return;
  regl.clear({color: [1, 1, 1, 1]})
  camera(() => {
    drawFaces(faces)
  });
})
