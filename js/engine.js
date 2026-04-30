import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export let scene, camera, renderer, controls, ground, gridHelper, ambientLight, dirLight;

const textureLoader = new THREE.TextureLoader();
textureLoader.setCrossOrigin('anonymous');

const GRID_SIZE = 2;
const animatedGifTextures = new Set();

let horizonMesh;

function isGif(url) {
    return typeof url === 'string' && url.split('?')[0].toLowerCase().endsWith('.gif');
}

function trackAnimatedGifTexture(entry) {
    animatedGifTextures.add(entry);
}

function updateAnimatedGifTextures() {
    animatedGifTextures.forEach(({ image, canvas, ctx, texture }) => {
        if (!image.complete || !image.naturalWidth) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        texture.needsUpdate = true;
    });
}

function loadGifTexture(url, onLoad, onError) {
    const image = new Image();
    image.crossOrigin = 'anonymous';

    image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth || 1;
        canvas.height = image.naturalHeight || 1;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        trackAnimatedGifTexture({ image, canvas, ctx, texture });
        onLoad(texture);
    };

    image.onerror = onError;
    image.src = url;
}

function loadTexture(url, onLoad, onError) {
    if (isGif(url)) {
        loadGifTexture(url, onLoad, onError);
        return;
    }

    const texture = textureLoader.load(
        url,
        () => {
            texture.colorSpace = THREE.SRGBColorSpace;
            onLoad(texture);
        },
        undefined,
        onError
    );
}

export function updateBackground(url) {
    if (horizonMesh) {
        scene.remove(horizonMesh);
        horizonMesh.geometry.dispose();
        horizonMesh.material.dispose();
        horizonMesh = null;
    }
    if (!url) return;

    const geo = new THREE.SphereGeometry(500, 64, 32);
    const mat = new THREE.MeshBasicMaterial({
        side: THREE.BackSide,
        transparent: true,
        alphaTest: 0.01
    });

    loadTexture(
        url,
        (texture) => {
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            mat.map = texture;
            mat.needsUpdate = true;
        },
        () => {
            console.warn("Nao foi possivel carregar o fundo:", url);
            if (window.customAlert) {
                window.customAlert(`Nao foi possivel carregar o fundo: ${url}`);
            }
        }
    );

    horizonMesh = new THREE.Mesh(geo, mat);
    horizonMesh.rotation.y = Math.PI;
    scene.add(horizonMesh);
}

export function updateEnvironment(time) {
    switch (time) {
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

export function updateMapSize(width, height) {
    const wDivs = parseInt(width);
    const hDivs = parseInt(height);
    const w = wDivs * GRID_SIZE;
    const h = hDivs * GRID_SIZE;

    ground.geometry.dispose();
    ground.geometry = new THREE.PlaneGeometry(w, h);

    if (gridHelper) scene.remove(gridHelper);

    let maxDivs = Math.max(wDivs, hDivs);
    if (maxDivs % 2 !== 0) maxDivs++;

    gridHelper = new THREE.GridHelper(maxDivs * GRID_SIZE, maxDivs, 0x000000, 0x000000);
    gridHelper.position.set(0, 0.01, 0);
    gridHelper.material.opacity = 0.2;
    gridHelper.material.transparent = true;
    scene.add(gridHelper);
}

export function updateTerrainTexture(type, customUrl = null) {
    ground.material.map = null;
    ground.material.color.setHex(0xffffff);

    if (customUrl) {
        loadTexture(
            customUrl,
            (texture) => {
                texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
                texture.repeat.set(5, 5);
                ground.material.map = texture;
                ground.material.needsUpdate = true;
            },
            () => {
                console.warn("Nao foi possivel carregar a textura do terreno:", customUrl);
                if (window.customAlert) {
                    window.customAlert(`Nao foi possivel carregar a textura do terreno: ${customUrl}`);
                }
            }
        );
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

    gridHelper = new THREE.GridHelper(52, 26, 0x000000, 0x000000);
    gridHelper.material.opacity = 0.2;
    gridHelper.material.transparent = true;
    gridHelper.position.set(0, 0.01, 0);
    scene.add(gridHelper);

    function animate() {
        requestAnimationFrame(animate);
        updateAnimatedGifTextures();
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
