import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export let scene, camera, renderer, controls, ground, gridHelper, ambientLight, dirLight;

const textureLoader = new THREE.TextureLoader();

export function updateEnvironment(time) {
    switch(time) {
        case 'day':
            scene.background.setHex(0x87CEEB);
            ambientLight.intensity = 0.6;
            dirLight.intensity = 0.8;
            dirLight.color.setHex(0xffffff);
            break;
        case 'afternoon':
            scene.background.setHex(0xFF4500);
            ambientLight.intensity = 0.4;
            dirLight.intensity = 1.0;
            dirLight.color.setHex(0xFFAA33);
            break;
        case 'night':
            scene.background.setHex(0x050510);
            ambientLight.intensity = 0.1;
            dirLight.intensity = 0.2;
            dirLight.color.setHex(0x4444FF);
            break;
    }
}

const GRID_SIZE = 2;

export function updateMapSize(width, height) {
    const w = parseInt(width) * GRID_SIZE;
    const h = parseInt(height) * GRID_SIZE;
    
    ground.geometry.dispose();
    ground.geometry = new THREE.PlaneGeometry(w, h);
    
    if (gridHelper) scene.remove(gridHelper);
    // GridHelper usa tamanho total e divisões
    gridHelper = new THREE.GridHelper(Math.max(w, h), Math.max(width, height), 0x000000, 0x000000);
    gridHelper.material.opacity = 0.2;
    gridHelper.material.transparent = true;
    gridHelper.position.y = 0.01;
    scene.add(gridHelper);
}

export function updateTerrainTexture(type, customUrl = null) {
    ground.material.map = null;
    ground.material.color.setHex(0xffffff);

    if (type === 'custom' && customUrl) {
        const texture = textureLoader.load(customUrl);
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(5, 5);
        ground.material.map = texture;
    } else if (type === 'grass') {
        ground.material.color.setHex(0x4CAF50);
    } else if (type === 'stone') {
        ground.material.color.setHex(0x808080);
    } else if (type === 'snow') {
        ground.material.color.setHex(0xffffff);
    }
    
    ground.material.needsUpdate = true;
}

export function initEngine() {
    const container = document.getElementById('vtt-canvas');

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 15, 15);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = true; 
    
    controls.minDistance = 2;  
    controls.maxDistance = 150; 
    controls.maxPolarAngle = Math.PI / 2 - 0.05; 

    ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 20, 10);
    scene.add(dirLight);

    const planeGeo = new THREE.PlaneGeometry(50, 50);
    const planeMat = new THREE.MeshStandardMaterial({ color: 0x4CAF50, side: THREE.DoubleSide });
    ground = new THREE.Mesh(planeGeo, planeMat);
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    gridHelper = new THREE.GridHelper(50, 25, 0x000000, 0x000000);
    gridHelper.material.opacity = 0.2;
    gridHelper.material.transparent = true;
    gridHelper.position.y = 0.01; 
    scene.add(gridHelper);

    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}