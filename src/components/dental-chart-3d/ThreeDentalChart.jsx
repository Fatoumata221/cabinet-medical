import React, { useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { useToothSelector } from '../dental-chart/useToothSelector';
import { TOOTH_STATES } from '../dental-chart/constants';

// Simplified tooth data for 3D representation
const dentalArchData = [
  // Upper Jaw (example simplified positions)
  { id: 11, position: [-2, 0.5, -0.5], type: 'molar' },
  { id: 12, position: [-1.5, 0.5, -0.7], type: 'molar' },
  { id: 13, position: [-1, 0.5, -0.8], type: 'premolar' },
  { id: 14, position: [-0.5, 0.5, -0.7], type: 'premolar' },
  { id: 15, position: [0, 0.5, -0.5], type: 'canine' },
  { id: 16, position: [0.5, 0.5, -0.3], type: 'incisor' },
  { id: 17, position: [1, 0.5, -0.2], type: 'incisor' },
  { id: 18, position: [1.5, 0.5, -0.3], type: 'canine' },
  // Lower Jaw (example simplified positions)
  { id: 21, position: [-2, -0.5, 0.5], type: 'molar' },
  { id: 22, position: [-1.5, -0.5, 0.7], type: 'molar' },
  { id: 23, position: [-1, -0.5, 0.8], type: 'premolar' },
  { id: 24, position: [-0.5, -0.5, 0.7], type: 'premolar' },
  { id: 25, position: [0, -0.5, 0.5], type: 'canine' },
  { id: 26, position: [0.5, -0.5, 0.3], type: 'incisor' },
  { id: 27, position: [1, -0.5, 0.2], type: 'incisor' },
  { id: 28, position: [1.5, -0.5, 0.3], type: 'canine' },
];

const ThreeDentalChart = ({ readOnly = false }) => {
  const mountRef = useRef(null);
  const { teeth, handleToothClick, setToothState } = useToothSelector({});
  const sceneRef = useRef(new THREE.Scene());
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());

  // Materials for different tooth states
  const materialHealthy = new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.2, roughness: 0.8 });
  const materialSelected = new THREE.MeshStandardMaterial({ color: 0x1a73e8, emissive: 0x1a73e8, emissiveIntensity: 0.3, metalness: 0.2, roughness: 0.8 });
  // Add more materials for other states if needed

  const getToothMaterial = useCallback((toothId) => {
    const state = teeth[toothId]?.state || TOOTH_STATES.HEALTHY.id;
    switch (state) {
      case TOOTH_STATES.SELECTED.id:
        return materialSelected;
      case TOOTH_STATES.HEALTHY.id:
      default:
        return materialHealthy;
    }
  }, [teeth]);

  // Function to create a simple tooth mesh
  const createToothMesh = (toothData) => {
    // For simplicity, using a CylinderGeometry. Can be replaced with more complex models.
    const geometry = new THREE.CylinderGeometry(0.1, 0.15, 0.5, 8); // top radius, bottom radius, height, radial segments
    const material = getToothMaterial(toothData.id);
    const toothMesh = new THREE.Mesh(geometry, material);
    toothMesh.position.set(...toothData.position);
    toothMesh.rotation.z = Math.PI / 2; // Lay flat
    toothMesh.userData = { toothId: toothData.id }; // Store toothId for raycasting
    return toothMesh;
  };

  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;

    // Scene
    const scene = sceneRef.current;
    scene.background = new THREE.Color(0xf0f0f0); // Light grey background

    // Camera
    const camera = new THREE.PerspectiveCamera(75, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
    camera.position.set(0, 3, 5); // Position the camera to look at the center
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    currentMount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; // An animation loop is required when damping is enabled
    controls.dampingFactor = 0.25;
    controls.screenSpacePanning = false;
    controls.maxPolarAngle = Math.PI / 2; // Don't allow camera to go below ground
    controlsRef.current = controls;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // Soft white light
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1).normalize();
    scene.add(directionalLight);

    // Add teeth to scene
    dentalArchData.forEach(toothData => {
      const toothMesh = createToothMesh(toothData);
      scene.add(toothMesh);
    });

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update(); // only required if controls.enableDamping is set to true
      renderer.render(scene, camera);
    };
    animate();

    // Handle window resize
    const onResize = () => {
      camera.aspect = currentMount.clientWidth / currentMount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    };
    window.addEventListener('resize', onResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', onResize);
      controls.dispose();
      currentMount.removeChild(renderer.domElement);
      renderer.dispose();
      // Remove all objects from the scene
      while (scene.children.length > 0) {
        const object = scene.children[0];
        scene.remove(object);
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          object.material.dispose();
        }
      }
    };
  }, []); // Empty dependency array means this effect runs once on mount

  useEffect(() => {
    // Update materials of existing teeth when `teeth` state changes
    sceneRef.current.children.forEach(object => {
      if (object.isMesh && object.userData.toothId) {
        object.material = getToothMaterial(object.userData.toothId);
      }
    });
  }, [teeth, getToothMaterial]);

  const onMouseClick = useCallback((event) => {
    if (readOnly) return;

    event.preventDefault();

    const canvas = rendererRef.current.domElement;
    const rect = canvas.getBoundingClientRect();
    mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);

    const intersects = raycasterRef.current.intersectObjects(sceneRef.current.children, true);

    if (intersects.length > 0) {
      const clickedObject = intersects[0].object;
      if (clickedObject.userData.toothId) {
        handleToothClick(clickedObject.userData.toothId);
      }
    }
  }, [handleToothClick, readOnly]);


  useEffect(() => {
    const canvas = rendererRef.current?.domElement;
    if (canvas) {
      canvas.addEventListener('click', onMouseClick);
    }
    return () => {
      if (canvas) {
        canvas.removeEventListener('click', onMouseClick);
      }
    };
  }, [onMouseClick]);


  return <div ref={mountRef} style={{ width: '100%', height: '100vh', overflow: 'hidden' }} />;
};

export default ThreeDentalChart;
