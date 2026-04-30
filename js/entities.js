import * as THREE from 'three';
import { scene } from './engine.js';

const textureLoader = new THREE.TextureLoader();
textureLoader.setCrossOrigin('anonymous');

const animatedGifTextures = new Set();
let animationLoopStarted = false;

function isGif(url) {
    return typeof url === 'string' && url.split('?')[0].toLowerCase().endsWith('.gif');
}

function trackAnimatedGifTexture(entry) {
    animatedGifTextures.add(entry);
    if (animationLoopStarted) return;

    animationLoopStarted = true;
    function updateGifFrames() {
        animatedGifTextures.forEach(({ image, canvas, ctx, texture }) => {
            if (!image.complete || !image.naturalWidth) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
            texture.needsUpdate = true;
        });
        requestAnimationFrame(updateGifFrames);
    }
    requestAnimationFrame(updateGifFrames);
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

export function addSpriteToBoard(x, z, dbData) {
    if (!dbData) {
        console.error("Tentativa de adicionar sprite com dados indefinidos em:", x, z);
        return;
    }
    const group = new THREE.Group();
    const needsMovement = dbData.tipo === 'criatura' || dbData.categoria === 'heroi' || dbData.categoria === 'monstro';

    const imgFallback = "https://cdn-icons-png.flaticon.com/512/1695/1695213.png";
    const imgUrl = dbData.imagem_url || imgFallback;
    const visualSize = (dbData.tamanho || 1) * 2;

    const geo = new THREE.PlaneGeometry(visualSize, visualSize);
    const material = new THREE.MeshBasicMaterial({
        transparent: true,
        alphaTest: 0.5,
        side: THREE.DoubleSide
    });

    const applyTexture = (loadedTexture) => {
        material.map = loadedTexture;
        material.needsUpdate = true;
    };

    const handleTextureError = () => {
        console.warn("Erro CORS ou de carregamento. A imagem nao pode ser carregada pelo WebGL:", imgUrl);
        if (window.customAlert) {
            window.customAlert(`Nao foi possivel carregar a imagem de "${dbData.nome}". Usando imagem padrao.`);
        }

        const fallbackTexture = textureLoader.load(imgFallback, () => {
            fallbackTexture.colorSpace = THREE.SRGBColorSpace;
            applyTexture(fallbackTexture);
        });
    };

    if (isGif(imgUrl)) {
        loadGifTexture(imgUrl, applyTexture, handleTextureError);
    } else {
        const texture = textureLoader.load(
            imgUrl,
            () => {
                texture.colorSpace = THREE.SRGBColorSpace;
                applyTexture(texture);
            },
            undefined,
            handleTextureError
        );
    }

    const tokenMesh = new THREE.Mesh(geo, material);
    tokenMesh.position.y = visualSize / 2;
    tokenMesh.name = "token_mesh";

    const baseGeo = new THREE.RingGeometry((visualSize / 2) * 0.8, visualSize / 2, 32);
    const baseMat = new THREE.MeshBasicMaterial({
        color: dbData.cor || 0xd4af37,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.6
    });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.rotation.x = -Math.PI / 2;
    base.position.y = 0.05;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 64;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.roundRect(0, 0, 256, 64, 10);
    ctx.fill();
    ctx.fillStyle = 'white';
    ctx.font = 'bold 32px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(dbData.nome, 128, 45);

    const nameTex = new THREE.CanvasTexture(canvas);
    const nameMat = new THREE.SpriteMaterial({ map: nameTex, transparent: true });
    const nameSprite = new THREE.Sprite(nameMat);
    nameSprite.scale.set(3, 0.75, 1);
    nameSprite.position.y = visualSize + 0.8;

    group.add(tokenMesh);
    group.add(base);
    group.add(nameSprite);

    tokenMesh.onBeforeRender = (renderer, scene, camera) => {
        tokenMesh.quaternion.copy(camera.quaternion);
    };

    group.position.set(x, 0, z);
    group.userData = {
        id: dbData.id,
        nome: dbData.nome,
        tipo: dbData.tipo,
        categoria: dbData.categoria,
        tamanho: dbData.tamanho || 1,
        alcance_ataque: dbData.alcance_ataque || 1,
        deslocamento: dbData.deslocamento || (needsMovement ? 6 : 0)
    };

    group.type = "SpriteGroup";
    scene.add(group);
}

export function toggleStatusToGroup(group, statusType) {
    if (!group.userData.status) group.userData.status = {};

    const colors = {
        blood: 0xff0000,
        poison: 0x00ff00,
        shield: 0x0000ff,
        stun: 0xffff00
    };

    if (group.userData.status[statusType]) {
        const toRemove = group.children.find(c => c.name === `status_${statusType}`);
        if (toRemove) group.remove(toRemove);
        delete group.userData.status[statusType];
    } else {
        const geo = new THREE.SphereGeometry(0.2, 16, 16);
        const mat = new THREE.MeshBasicMaterial({ color: colors[statusType] });
        const marker = new THREE.Mesh(geo, mat);

        const count = Object.keys(group.userData.status).length;
        const angle = count * 1.5;
        const radius = (group.userData.tamanho || 1) + 0.2;

        marker.position.set(Math.cos(angle) * radius, 1, Math.sin(angle) * radius);
        marker.name = `status_${statusType}`;

        group.add(marker);
        group.userData.status[statusType] = true;
    }
}
