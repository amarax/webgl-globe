var CAM =  CAM || {};

CAM.CameraController = function(aCamera, aCameraTarget, aScene)
{
	var scene = aScene;
	var camera = aCamera;
	var cameraTarget = aCameraTarget

	var raycaster = new THREE.Raycaster();

	var mouseOnDownCameraRotation = new THREE.Quaternion();
	var cameraTargetRotation = new THREE.Quaternion();

	var mouseOnDownGlobeIntersection, mouseOnDownCameraSpacePosition;
	var mouseOnMoveGlobeIntersection;

	var curZoomSpeed = 0;
	var zoomSpeed = 50;
	var distance = 1000, distanceTarget = 1000;

	// Debug meshes
	var mouseDownPointIndicatorMesh, mouseDownCameraSpaceMesh, mouseDownCameraIndicatorMesh;
	var mouseMoveTargetIndicatorMesh;

	function init()
	{
	    camera.position.x = 0.0;
	    camera.position.y = 0.0;
	    camera.position.z = 1000;
	    camera.lookAt(cameraTarget.position);
	}

	init();

	this.setupDebugGeometry = function()
	{
		var geometry;

	    var indicatorSize = 5;
	    var pointSize = 0.5;

	    // Setup MouseDown debug
	    geometry = new THREE.BoxGeometry(indicatorSize, indicatorSize, indicatorSize);
	    mouseDownPointIndicatorMesh = new THREE.Mesh( geometry );
	    mouseDownPointIndicatorMesh.visible = true;
	    scene.add( mouseDownPointIndicatorMesh );

	    geometry = new THREE.BoxGeometry(indicatorSize, indicatorSize, indicatorSize);
	    mouseDownCameraSpaceMesh = new THREE.Mesh( geometry );
	    mouseDownCameraSpaceMesh.visible = true;
	    scene.add( mouseDownCameraSpaceMesh );

	    geometry = new THREE.BoxGeometry(indicatorSize, indicatorSize, indicatorSize);
	    mouseMoveTargetIndicatorMesh = new THREE.Mesh( geometry );
	    mouseMoveTargetIndicatorMesh.visible = true;
	    scene.add( mouseMoveTargetIndicatorMesh );

	    var cameraDebugHeight = 800;
	    geometry = new THREE.BoxGeometry(pointSize, pointSize, cameraDebugHeight);
	    geometry.applyMatrix(new THREE.Matrix4().makeTranslation(0,0,cameraDebugHeight / 2.0));
	    mouseDownCameraIndicatorMesh = new THREE.Mesh( geometry );
	    scene.add( mouseDownCameraIndicatorMesh );
	}

	this.onMouseDown = function(event)
	{
	    // Get point on globe
	    var mouseScreenPos = new THREE.Vector2();
	    mouseScreenPos.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	    mouseScreenPos.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

	    raycaster.setFromCamera( mouseScreenPos, camera );
	    var intersects = raycaster.intersectObject( cameraTarget );
	    if( intersects.length > 0 )
	    {
	      mouseOnDownGlobeIntersection = intersects[0].point;
	      mouseOnMoveGlobeIntersection = mouseOnDownGlobeIntersection;

	      var cameraSpaceMatrix = new THREE.Matrix4();
	      cameraSpaceMatrix.getInverse( camera.matrix );
	      mouseOnDownCameraSpacePosition = mouseOnDownGlobeIntersection.clone().applyMatrix4( cameraSpaceMatrix );

	      // Add debug indicator
	      mouseDownPointIndicatorMesh.position.copy( mouseOnDownGlobeIntersection );
	      mouseDownPointIndicatorMesh.lookAt( cameraTarget.position );
	      mouseDownPointIndicatorMesh.updateMatrix();

	      mouseDownPointIndicatorMesh.visible = true;
	    }

	    // mouseOnDownCameraRotation = camera.quaternion.clone().inverse();
	    mouseDownCameraIndicatorMesh.lookAt(camera.position);
	    mouseOnDownCameraRotation = mouseDownCameraIndicatorMesh.quaternion.clone();

	    cameraTargetRotation.copy(mouseOnDownCameraRotation);
		}

	this.onMouseMove = function(event)
	{
	    var zoomDamp = distance/1000;
	    zoomDamp *= 0.005;

	    if( mouseOnDownGlobeIntersection != null )
	    {
	      // Get point on globe
	      var mouseScreenPos = new THREE.Vector2();
	      mouseScreenPos.x = ( event.x / window.innerWidth ) * 2 - 1;
	      mouseScreenPos.y = - ( event.y / window.innerHeight ) * 2 + 1;

	      raycaster.setFromCamera( mouseScreenPos, camera );
	      var intersects = raycaster.intersectObject( cameraTarget );

	      if( intersects.length > 0 )
	      {
	        mouseOnMoveGlobeIntersection = intersects[0].point;

	        mouseMoveTargetIndicatorMesh.position.copy(mouseOnMoveGlobeIntersection);
	        mouseMoveTargetIndicatorMesh.lookAt(cameraTarget.position);

	        var u = mouseOnMoveGlobeIntersection.clone();
	        u.normalize();

	        var v = mouseOnDownGlobeIntersection.clone();
	        v.normalize();

	        var cameraRotationOffset = new THREE.Quaternion();
	        cameraRotationOffset.setFromUnitVectors( u, v );
	        cameraTargetRotation.copy( mouseOnDownCameraRotation );
	        cameraTargetRotation.multiply( cameraRotationOffset );
	      }
	    }

	}

	this.onMouseWheel = function(event)
	{
		zoom(event.wheelDeltaY * 0.3);
	}



	function zoom(delta)
	{
		var maxZoom = 350;
		var minZoom = 1500;

	    distanceTarget -= delta;
	    distanceTarget = distanceTarget > minZoom ? minZoom : distanceTarget;
	    distanceTarget = distanceTarget < maxZoom ? maxZoom : distanceTarget;
	}

	this.update = function()
	{
	    zoom(curZoomSpeed);

	    // rotation.x += (target.x - rotation.x) * 0.1;
	    // rotation.y += (target.y - rotation.y) * 0.1;
	    distance += (distanceTarget - distance) * 0.3;

	    // camera.position.x = distance * Math.sin(rotation.x) * Math.cos(rotation.y);
	    // camera.position.y = distance * Math.sin(rotation.y);
	    // camera.position.z = distance * Math.cos(rotation.x) * Math.cos(rotation.y);


	    var currentCameraPositionRotation = new THREE.Quaternion();
	    currentCameraPositionRotation.setFromUnitVectors( new THREE.Vector3(0,0,1), camera.position.normalize() );

	    var newQuat = new THREE.Quaternion();
	    // THREE.Quaternion.slerp( currentCameraPositionRotation, cameraPositionRotation, newQuat, 0.5);
	    THREE.Quaternion.slerp( currentCameraPositionRotation, cameraTargetRotation, newQuat, 0.5);

	    camera.position.x = 0.0;
	    camera.position.y = 0.0;
	    camera.position.z = distance;

	    camera.position.applyQuaternion( newQuat );

	    camera.lookAt(cameraTarget.position);
	    camera.updateMatrix();

	    if( mouseOnDownCameraSpacePosition != null )
	    {
	      mouseDownCameraSpaceMesh.position.copy( mouseOnDownCameraSpacePosition.clone().applyMatrix4( camera.matrix ) );
	      mouseDownCameraSpaceMesh.lookAt(cameraTarget.position);
	      mouseDownCameraSpaceMesh.updateMatrix();
	    }
	}
};
