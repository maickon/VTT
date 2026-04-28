import * as THREE from 'three';
import { scene } from './engine.js';

const textureLoader = new THREE.TextureLoader();
textureLoader.setCrossOrigin('anonymous');

export function addSpriteToBoard(x, z, dbData) {
    const group = new THREE.Group();

    // 1. O TOKEN (Imagem Principal)
    const imgUrl = dbData.imagem_url || "https://cdn-icons-png.flaticon.com/512/1695/1695213.png";
    const texture = textureLoader.load(imgUrl);
    texture.colorSpace = THREE.SRGBColorSpace; 
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(material);
    
    const visualSize = (dbData.tamanho || 1) * 2;
    sprite.scale.set(visualSize, visualSize, 1);
    sprite.position.y = visualSize / 2; 

    // 2. A BASE (Círculo sob os pés)
    const baseGeo = new THREE.RingGeometry((visualSize/2) * 0.8, visualSize/2, 32);
    const baseMat = new THREE.MeshBasicMaterial({ color: dbData.cor || 0xd4af37, side: THREE.DoubleSide, transparent: true, opacity: 0.6 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.rotation.x = -Math.PI / 2;
    base.position.y = 0.1;

    // 3. O RÓTULO (Nome flutuando)
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 256; canvas.height = 64;
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

    group.add(sprite);
    group.add(base);
    group.add(nameSprite);
    
    group.position.set(x, 0, z);
    group.userData = { 
        id: dbData.id, 
        nome: dbData.nome, 
        tipo: dbData.tipo, 
        tamanho: dbData.tamanho || 1 
    };
    
    // Sobrescreve o tipo para que o Raycaster e o Drag continuem funcionando
    // No Three.js, o group não é um Sprite, então precisamos ajustar as interações.
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
        // Remove status
        const toRemove = group.children.find(c => c.name === `status_${statusType}`);
        if (toRemove) group.remove(toRemove);
        delete group.userData.status[statusType];
    } else {
        // Adiciona status (pequena esfera flutuante)
        const geo = new THREE.SphereGeometry(0.2, 16, 16);
        const mat = new THREE.MeshBasicMaterial({ color: colors[statusType] });
        const marker = new THREE.Mesh(geo, mat);
        
        // Posicionamento orbital baseado na quantidade de status
        const count = Object.keys(group.userData.status).length;
        const angle = count * 1.5;
        const radius = (group.userData.tamanho || 1) + 0.2;
        
        marker.position.set(Math.cos(angle) * radius, 1, Math.sin(angle) * radius);
        marker.name = `status_${statusType}`;
        
        group.add(marker);
        group.userData.status[statusType] = true;
    }
}