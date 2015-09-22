var GLOBEDATA = GLOBEDATA || {};

GLOBEDATA.PointCloud = function(aScene)
{
  var scene = aScene;

  var positions, colors;

  var getSourceSynch = function(url) {
    var req = new XMLHttpRequest();
    req.open("GET", url, false);
    req.send(null);
    return (req.status == 200) ? req.responseText : null;
  };

  var calc3DPos = function(lat, lng, alt)
  {
    var earthRadius = 6378100.0;
    var sphereRadius = 200.0;

    var phi = (90 - lat) * Math.PI / 180;
    var theta = (180 - lng) * Math.PI / 180;
    var dist = (1.0 + alt / earthRadius) * sphereRadius;

    var pos = new THREE.Vector3();
    pos.x = dist * Math.sin(phi) * Math.cos(theta);
    pos.y = dist * Math.cos(phi);
    pos.z = dist * Math.sin(phi) * Math.sin(theta);

    return pos;
  };

  this.init = function(aData)
  {
    var data = aData;
    var geom = new THREE.BufferGeometry();

    var iterations = 3;

    console.log(data.length * iterations);

    positions = new Float32Array( (data.length * iterations) * 3 );
    colors = new Float32Array( (data.length * iterations) * 3 );

    for (i = 0; i < data.length; i += 3) {
      lat = data[i];
      lng = data[i + 1];
      size = data[i + 2];

      for (j = 1; j <= iterations; j++ )
      {
        var pos = calc3DPos(lat, lng, (j / iterations) * 400000.0);

        var currentIndex = i * j + j - 1;
        currentIndex *= 3;

        positions[ currentIndex ] = pos.x;
        positions[ currentIndex + 1 ] = pos.y;
        positions[ currentIndex + 2 ] = pos.z;

        colors[ currentIndex ] = 1.0;
        colors[ currentIndex + 1 ] = 1.0;
        colors[ currentIndex + 2 ] = 1.0;
      }
    }

    geom.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
    geom.addAttribute( 'color', new THREE.BufferAttribute( colors, 3 ) );
    geom.computeBoundingBox();

    var material = new THREE.PointsMaterial( { size: 2.0, vertexColors: THREE.VertexColors, transparent: true, blending: THREE.AdditiveBlending } );
    var pointCloud = new THREE.Points(geom, material);
    scene.add(pointCloud);
  }

  this.update = function()
  {
    var newColor = (new Date().getTime() % 1000) / 1000.0;
    //console.log(newColor);
    for( i = 0; i < colors.length; i++ )
    {
      colors[i] = newColor;

    }
  }
}
