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
const METERS_PER_SQUARE = 1.5;

let movementHud = null;

function isMovableCreature(obj) {
    if (!obj) return false;
    const data = obj.userData || obj;
    return data.tipo === 'criatura' || data.categoria === 'heroi' || data.categoria === 'monstro';
}

function getMovementLimitSquares(obj) {
    const raw = Number(obj?.userData?.deslocamento ?? obj?.deslocamento ?? 6);
    return Number.isFinite(raw) && raw > 0 ? raw : 6;
}

function getMovedSquares(from, x, z) {
    return Math.hypot(x - from.x, z - from.z) / GRID_SIZE;
}

function formatMeters(squares) {
    return (squares * METERS_PER_SQUARE).toLocaleString('pt-BR', {
        maximumFractionDigits: 1
    });
}

function showMovementHud(movedSquares, limitSquares, overLimit = false) {
    if (!movementHud) {
        movementHud = document.createElement('div');
        movementHud.id = 'movement-distance-hud';
        document.body.appendChild(movementHud);
    }

    movementHud.textContent = `Deslocamento: ${formatMeters(movedSquares)}m / ${formatMeters(limitSquares)}m`;
    movementHud.classList.toggle('over-limit', overLimit);
    movementHud.classList.remove('hidden');
}

function hideMovementHud() {
    if (movementHud) movementHud.classList.add('hidden');
}

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

let hoverIndicator = null;
let attackRangeIndicator = null;
let movementRangeIndicator = null;

function hideMovementRange() {
    if (movementRangeIndicator) {
        scene.remove(movementRangeIndicator);
        movementRangeIndicator.traverse((child) => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
        });
        movementRangeIndicator = null;
    }
}

function showMovementRange(obj) {
    hideMovementRange();
    if (!isMovableCreature(obj)) return;

    const limitSquares = getMovementLimitSquares(obj);
    const radius = limitSquares * GRID_SIZE;
    const circleGeo = new THREE.CircleGeometry(radius, 72);
    const circleMat = new THREE.MeshBasicMaterial({
        color: 0xffd84d,
        transparent: true,
        opacity: 0.14,
        side: THREE.DoubleSide,
        depthWrite: false
    });
    movementRangeIndicator = new THREE.Mesh(circleGeo, circleMat);
    movementRangeIndicator.rotation.x = -Math.PI / 2;
    movementRangeIndicator.position.set(originalPosition.x, 0.035, originalPosition.z);

    const ringGeo = new THREE.RingGeometry(Math.max(radius - 0.06, 0.01), radius + 0.06, 96);
    const ringMat = new THREE.MeshBasicMaterial({
        color: 0xffd84d,
        transparent: true,
        opacity: 0.85,
        side: THREE.DoubleSide,
        depthWrite: false
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.y = 0.004;
    movementRangeIndicator.add(ring);

    scene.add(movementRangeIndicator);
}

function showOccupiedSpace(obj) {
    if (hoverIndicator) scene.remove(hoverIndicator);
    if (!obj || obj.userData.tipo === "cenario") return;

    const size = obj.userData.tamanho || 1;
    const rangeSize = size * GRID_SIZE;
    
    const geo = new THREE.PlaneGeometry(rangeSize, rangeSize);
    const mat = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.2, side: THREE.DoubleSide });
    hoverIndicator = new THREE.Mesh(geo, mat);
    hoverIndicator.rotation.x = -Math.PI / 2;
    hoverIndicator.position.set(obj.position.x, 0.04, obj.position.z);
    
    scene.add(hoverIndicator);
}

function showAttackRange(obj) {
    if (attackRangeIndicator) scene.remove(attackRangeIndicator);
    
    const reach = obj.userData.alcance_ataque || 1; 
    const size = obj.userData.tamanho || 1;
    const rangeSize = (size + reach * 2) * GRID_SIZE;
    
    // Mostra apenas o contorno e um preenchimento bem sutil
    const geo = new THREE.PlaneGeometry(rangeSize, rangeSize);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.05, side: THREE.DoubleSide });
    attackRangeIndicator = new THREE.Mesh(geo, mat);
    attackRangeIndicator.rotation.x = -Math.PI / 2;
    attackRangeIndicator.position.set(obj.position.x, 0.02, obj.position.z);
    
    // Grade interna do alcance (mais squares)
    const segments = size + reach * 2;
    const grid = new THREE.GridHelper(rangeSize, segments, 0xffff00, 0xffff00);
    grid.rotation.x = -Math.PI / 2;
    grid.material.opacity = 0.3;
    grid.material.transparent = true;
    attackRangeIndicator.add(grid);
    
    scene.add(attackRangeIndicator);
}

export function initInteractions() {
    let startX = 0, startY = 0;

    window.addEventListener('contextmenu', (e) => e.preventDefault());

    function isModalOpen() {
        return !document.getElementById('library-modal').classList.contains('hidden') ||
               !document.getElementById('maps-modal').classList.contains('hidden') ||
               !document.getElementById('assets-modal').classList.contains('hidden') ||
               !document.getElementById('custom-modal-container').classList.contains('hidden');
    }

    window.addEventListener('pointerdown', (event) => {
        if (event.target.closest('#ui-layer') || isModalOpen() || event.target.closest('#context-menu')) return;
        
        contextMenu.classList.add('hidden');
        document.querySelectorAll('.submenu').forEach(s => s.style.display = 'none');
        if (attackRangeIndicator) { scene.remove(attackRangeIndicator); attackRangeIndicator = null; }

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
                if (isMovableCreature(draggedObject)) {
                    showMovementHud(0, getMovementLimitSquares(draggedObject));
                    showMovementRange(draggedObject);
                }
                if (rangeIndicator) scene.remove(rangeIndicator);
                if (hoverIndicator) scene.remove(hoverIndicator);
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
            // Reset de submenu
            document.querySelectorAll('.submenu').forEach(s => s.style.display = 'none');
        }
    }

    window.addEventListener('pointermove', (event) => {
        if (Math.hypot(event.clientX - startX, event.clientY - startY) > 10) {
            clearTimeout(pressTimer);
        }

        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);

        if (isDragging) {
            const intersects = raycaster.intersectObject(ground);
            if (intersects.length > 0) {
                const point = intersects[0].point;
                const size = draggedObject.userData.tamanho || 1;
                
                let snapX, snapZ;
                if (size % 2 === 0) {
                    // Tamanho par: snap nas intercessões (linhas) para ocupar os quadrados corretamente
                    snapX = Math.round(point.x / GRID_SIZE) * GRID_SIZE;
                    snapZ = Math.round(point.z / GRID_SIZE) * GRID_SIZE;
                } else {
                    // Tamanho ímpar: snap no centro do quadrado
                    snapX = Math.floor(point.x / GRID_SIZE) * GRID_SIZE + (GRID_SIZE / 2);
                    snapZ = Math.floor(point.z / GRID_SIZE) * GRID_SIZE + (GRID_SIZE / 2);
                }
                if (isMovableCreature(draggedObject)) {
                    const movedSquares = getMovedSquares(originalPosition, snapX, snapZ);
                    const limitSquares = getMovementLimitSquares(draggedObject);
                    const overLimit = movedSquares > limitSquares;
                    showMovementHud(movedSquares, limitSquares, overLimit);
                    if (overLimit) return;
                }

                draggedObject.position.set(snapX, 0, snapZ);
            }
        } else if (!isPlacingMode && !isModalOpen()) {
            // Lógica de Hover para mostrar espaço ocupado
            const intersects = raycaster.intersectObjects(scene.children, true);
            const target = intersects.find(obj => getParentGroup(obj.object));
            if (target) {
                showOccupiedSpace(getParentGroup(target.object));
            } else if (hoverIndicator) {
                scene.remove(hoverIndicator);
                hoverIndicator = null;
            }
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
            hideMovementHud();
            hideMovementRange();
            return;
        }

        if (event.target.closest('#ui-layer') || isModalOpen()) return;

        const distance = Math.hypot(event.clientX - startX, event.clientY - startY);
        if (distance > 10) return; 

        raycaster.setFromCamera(mouse, camera);

        if (isPlacingMode && entityToPlace) {
            const intersects = raycaster.intersectObject(ground);
            if (intersects.length > 0) {
                const point = intersects[0].point;
                const size = entityToPlace.tamanho || 1;

                let snapX, snapZ;
                if (size % 2 === 0) {
                    snapX = Math.round(point.x / GRID_SIZE) * GRID_SIZE;
                    snapZ = Math.round(point.z / GRID_SIZE) * GRID_SIZE;
                } else {
                    snapX = Math.floor(point.x / GRID_SIZE) * GRID_SIZE + (GRID_SIZE / 2);
                    snapZ = Math.floor(point.z / GRID_SIZE) * GRID_SIZE + (GRID_SIZE / 2);
                }
                
                if (entityToPlace.tipo === "criatura" && checkCollision(null, snapX, snapZ, entityToPlace.tamanho)) {
                    window.customAlert("Espaço ocupado!");
                } else {
                    addSpriteToBoard(snapX, snapZ, entityToPlace);
                }
                setPlacingMode(false);
                document.getElementById('vtt-canvas').style.cursor = 'default';
            }
        } else {
            // Clique simples em objeto (Nada por enquanto ou outra ação futura)
        }
    });

    document.getElementById('menu-range').onclick = () => {
        if (selectedObject) showAttackRange(selectedObject);
        contextMenu.classList.add('hidden');
    };

    // Lógica para abrir submenu de condições no clique (para mobile e desktop)
    const conditionTrigger = document.querySelector('.menu-submenu');
    if (conditionTrigger) {
        conditionTrigger.onclick = (e) => {
            e.stopPropagation();
            const submenu = conditionTrigger.querySelector('.submenu');
            if (submenu) {
                const isVisible = submenu.style.display === 'block';
                submenu.style.display = isVisible ? 'none' : 'block';
            }
        };
    }

    document.getElementById('menu-delete').onclick = async () => {
        if (selectedObject) {
            const confirm = await window.customConfirm(`Excluir "${selectedObject.userData.nome}"?`);
            if (confirm) {
                scene.remove(selectedObject);
                if (rangeIndicator) scene.remove(rangeIndicator);
                if (attackRangeIndicator) scene.remove(attackRangeIndicator);
            }
        }
        contextMenu.classList.add('hidden');
    };
}
