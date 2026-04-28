import * as THREE from 'three';
import { camera, scene, ground, controls } from './engine.js';
import { addSpriteToBoard } from './entities.js';

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

export let isPlacingMode = false;
export let entityToPlace = null;
export let isSceneryLocked = true; // Travado por padrão

// Funções seguras para atualizar as variáveis nos outros arquivos
export function setPlacingMode(state) { isPlacingMode = state; }
export function setEntity(entity) { entityToPlace = entity; }
export function setSceneryLock(state) { isSceneryLocked = state; }
export function getSelectedObject() { return selectedObject; }

let isDragging = false;
let draggedObject = null;
let originalPosition = new THREE.Vector3();
let rangeIndicator = null;
let selectedObject = null;
let pressTimer;

const contextMenu = document.getElementById('context-menu');
const GRID_SIZE = 2; 

function checkCollision(obj, x, z, size) {
    const halfSize = (size * GRID_SIZE) / 2;
    const myMinX = x - halfSize + 0.1;
    const myMaxX = x + halfSize - 0.1;
    const myMinZ = z - halfSize + 0.1;
    const myMaxZ = z + halfSize - 0.1;

    for (const child of scene.children) {
        if (child.type === "SpriteGroup" && child !== obj) {
            const isScenery = child.userData.tipo === "cenario";
            if (!isScenery) continue;

            const otherSize = child.userData.tamanho || 1;
            const otherHalfSize = (otherSize * GRID_SIZE) / 2;
            const otherMinX = child.position.x - otherHalfSize;
            const otherMaxX = child.position.x + otherHalfSize;
            const otherMinZ = child.position.z - otherHalfSize;
            const otherMaxZ = child.position.z + otherHalfSize;

            if (myMinX < otherMaxX && myMaxX > otherMinX &&
                myMinZ < otherMaxZ && myMaxZ > otherMinZ) {
                return true;
            }
        }
    }
    return false;
}

function showRange(obj) {
    if (rangeIndicator) scene.remove(rangeIndicator);
    
    const size = obj.userData.tamanho || 1;
    const rangeSize = size * GRID_SIZE;
    
    const geo = new THREE.PlaneGeometry(rangeSize, rangeSize);
    const mat = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.3, side: THREE.DoubleSide });
    rangeIndicator = new THREE.Mesh(geo, mat);
    rangeIndicator.rotation.x = -Math.PI / 2;
    rangeIndicator.position.set(obj.position.x, 0.05, obj.position.z);
    
    scene.add(rangeIndicator);
}

function getParentGroup(object) {
    let curr = object;
    while (curr) {
        if (curr.type === "SpriteGroup") return curr;
        curr = curr.parent;
    }
    return null;
}

export function initInteractions() {
    let startX = 0, startY = 0;

    window.addEventListener('contextmenu', (e) => e.preventDefault());

    window.addEventListener('pointerdown', (event) => {
        if (event.target.closest('#ui-layer') || event.target.closest('#nota-modal') || event.target.closest('#context-menu')) return;
        
        contextMenu.classList.add('hidden');

        startX = event.clientX;
        startY = event.clientY;

        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);

        // Detecção de clique longo (Mobile) ou Direito (PC)
        if (event.button === 2) {
            handleRightClick(event);
        } else {
            clearTimeout(pressTimer);
            pressTimer = window.setTimeout(() => {
                handleRightClick(event);
            }, 600);
        }

        if (!isPlacingMode) {
            const intersects = raycaster.intersectObjects(scene.children, true);
            const target = intersects.find(obj => getParentGroup(obj.object));

            if (target) {
                const group = getParentGroup(target.object);
                
                // Bloqueio de Cenário
                if (isSceneryLocked && group.userData.tipo === "cenario") {
                    return;
                }

                isDragging = true;
                draggedObject = group;
                originalPosition.copy(draggedObject.position);
                controls.enabled = false;
                if (rangeIndicator) scene.remove(rangeIndicator);
            }
        }
    });

    function handleRightClick(event) {
        const intersects = raycaster.intersectObjects(scene.children, true);
        const target = intersects.find(obj => getParentGroup(obj.object));
        
        if (target) {
            selectedObject = getParentGroup(target.object);
            contextMenu.style.top = `${event.clientY}px`;
            contextMenu.style.left = `${event.clientX}px`;
            contextMenu.classList.remove('hidden');
        }
    }

    window.addEventListener('pointermove', (event) => {
        if (Math.hypot(event.clientX - startX, event.clientY - startY) > 10) {
            clearTimeout(pressTimer);
        }

        if (!isDragging) return;

        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObject(ground);

        if (intersects.length > 0) {
            const point = intersects[0].point;
            const snapX = Math.round(point.x / GRID_SIZE) * GRID_SIZE;
            const snapZ = Math.round(point.z / GRID_SIZE) * GRID_SIZE;
            draggedObject.position.set(snapX, 0, snapZ);
        }
    });

    window.addEventListener('pointerup', (event) => {
        clearTimeout(pressTimer);

        if (isDragging) {
            const size = draggedObject.userData.tamanho || 1;
            if (draggedObject.userData.tipo === "criatura" && checkCollision(draggedObject, draggedObject.position.x, draggedObject.position.z, size)) {
                draggedObject.position.copy(originalPosition);
            }
            isDragging = false;
            draggedObject = null;
            controls.enabled = true;
            return;
        }

        if (event.target.closest('#ui-layer') || event.target.closest('#nota-modal')) return;

        const distance = Math.hypot(event.clientX - startX, event.clientY - startY);
        if (distance > 10) return; 

        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);

        if (isPlacingMode && entityToPlace) {
            const intersects = raycaster.intersectObject(ground);
            if (intersects.length > 0) {
                const point = intersects[0].point;
                const snapX = Math.round(point.x / GRID_SIZE) * GRID_SIZE;
                const snapZ = Math.round(point.z / GRID_SIZE) * GRID_SIZE;
                
                if (entityToPlace.tipo === "criatura" && checkCollision(null, snapX, snapZ, entityToPlace.tamanho)) {
                    alert("Espaço ocupado!");
                } else {
                    addSpriteToBoard(snapX, snapZ, entityToPlace);
                }
                setPlacingMode(false);
                document.getElementById('vtt-canvas').style.cursor = 'default';
            }
        } else {
            const intersects = raycaster.intersectObjects(scene.children, true);
            const target = intersects.find(obj => getParentGroup(obj.object));
            if (target) {
                abrirBlocoDeNotas(getParentGroup(target.object).userData);
            }
        }
    });

    document.getElementById('menu-range').onclick = () => {
        if (selectedObject) showRange(selectedObject);
        contextMenu.classList.add('hidden');
    };

    document.getElementById('menu-delete').onclick = () => {
        if (selectedObject) {
            scene.remove(selectedObject);
            if (rangeIndicator) scene.remove(rangeIndicator);
        }
        contextMenu.classList.add('hidden');
    };
}

function abrirBlocoDeNotas(dadosPersonagem) {
    const modal = document.getElementById('nota-modal');
    document.getElementById('nota-titulo').innerText = `Ficha: ${dadosPersonagem.nome}`;
    modal.classList.remove('hidden');
}