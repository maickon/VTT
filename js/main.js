import { initDatabase, getObjeto, getAllObjetos, addNovoObjeto, addMapa, getAllMapas, deleteMapa, getMapa } from './database.js';
import { initEngine, ground, updateEnvironment, updateMapSize, updateTerrainTexture, scene } from './engine.js';
import { initInteractions, setPlacingMode, setEntity, getSelectedObject, setSceneryLock } from './interactions.js';
import { addSpriteToBoard, toggleStatusToGroup } from './entities.js';

// --- CUSTOM MODALS SYSTEM ---
const modalContainer = document.getElementById('custom-modal-container');
const modalTitle = document.getElementById('custom-modal-title');
const modalMessage = document.getElementById('custom-modal-message');
const modalInput = document.getElementById('custom-modal-input');
const btnOk = document.getElementById('custom-modal-btn-ok');
const btnCancel = document.getElementById('custom-modal-btn-cancel');

function showCustomModal(title, message, isPrompt = false, isConfirm = false) {
    return new Promise((resolve) => {
        modalTitle.innerText = title;
        modalMessage.innerText = message;
        modalContainer.classList.remove('hidden');
        
        if (isPrompt) {
            modalInput.classList.remove('hidden');
            modalInput.value = '';
            modalInput.focus();
        } else {
            modalInput.classList.add('hidden');
        }

        if (isConfirm || isPrompt) {
            btnCancel.classList.remove('hidden');
        } else {
            btnCancel.classList.add('hidden');
        }

        btnOk.onclick = () => {
            const val = isPrompt ? modalInput.value : true;
            modalContainer.classList.add('hidden');
            resolve(val);
        };

        btnCancel.onclick = () => {
            modalContainer.classList.add('hidden');
            resolve(null);
        };
    });
}

window.customAlert = (msg) => showCustomModal("Aviso", msg);
window.customConfirm = (msg) => showCustomModal("Confirmação", msg, false, true);
window.customPrompt = (msg) => showCustomModal("Entrada", msg, true);

window.toggleStatus = (type) => {
    const selected = getSelectedObject();
    if (selected) {
        toggleStatusToGroup(selected, type);
        document.getElementById('context-menu').classList.add('hidden');
    }
};

async function startApp() {
    await initDatabase(); 
    initEngine();         
    initInteractions();   

    // --- LOGICA DA BIBLIOTECA ---
    const libModal = document.getElementById('library-modal');
    const libGrid = document.getElementById('library-grid');
    const newItemForm = document.getElementById('new-item-form');
    let currentTab = 'heroi';

    async function renderLibrary() {
        libGrid.innerHTML = '';
        const todos = await getAllObjetos();
        const filtrados = todos.filter(item => item.categoria === currentTab);

        if (filtrados.length === 0) {
            libGrid.innerHTML = '<p style="grid-column: span 3; text-align: center; color: #888; padding: 20px;">Nenhum item nesta categoria.</p>';
        }

        filtrados.forEach(item => {
            const div = document.createElement('div');
            div.className = 'library-item';
            div.innerHTML = `
                <img src="${item.imagem_url}" onerror="this.src='https://cdn-icons-png.flaticon.com/512/1695/1695213.png'">
                <span>${item.nome}</span>
                <small>${item.tamanho}x${item.tamanho}</small>
            `;
            div.onclick = () => {
                setPlacingMode(true);
                setEntity(item);
                libModal.classList.add('hidden');
                document.getElementById('vtt-canvas').style.cursor = 'crosshair';
            };
            libGrid.appendChild(div);
        });
    }

    document.getElementById('btn-open-library').onclick = () => {
        libModal.classList.remove('hidden');
        renderLibrary();
    };

    document.getElementById('btn-close-library').onclick = () => libModal.classList.add('hidden');

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.onclick = (e) => {
            const tab = e.target.dataset.tab;
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');

            if (tab === 'novo') {
                libGrid.classList.add('hidden');
                newItemForm.classList.remove('hidden');
            } else {
                currentTab = tab;
                libGrid.classList.remove('hidden');
                newItemForm.classList.add('hidden');
                renderLibrary();
            }
        };
    });

    document.getElementById('btn-create-item').onclick = async () => {
        const novo = {
            id: 'custom_' + Date.now(),
            nome: document.getElementById('new-nome').value,
            tipo: document.getElementById('new-tipo').value,
            categoria: document.getElementById('new-categoria').value,
            tamanho: parseInt(document.getElementById('new-tamanho').value),
            imagem_url: document.getElementById('new-imagem').value,
            cor: document.getElementById('new-cor').value
        };

        if (!novo.nome || !novo.imagem_url) return customAlert("Preencha nome e URL da imagem!");

        await addNovoObjeto(novo);
        await customAlert("Item adicionado à biblioteca!");
        
        // Volta para a aba do item criado
        currentTab = novo.categoria;
        document.querySelector(`[data-tab="${currentTab}"]`).click();
    };

    // --- LOGICA DE MODELOS DE MAPA ---
    document.getElementById('select-preset').addEventListener('change', async (e) => {
        const preset = e.target.value;
        
        // Limpa mapa
        const toRemove = [];
        scene.children.forEach(child => { if (child.type === "SpriteGroup") toRemove.push(child); });
        toRemove.forEach(obj => scene.remove(obj));

        if (preset === 'empty') return;

        const size = 30; 
        updateMapSize(size, size);
        document.getElementById('map-width').value = size;
        document.getElementById('map-height').value = size;

        if (preset === 'forest') {
            updateTerrainTexture('grass');
            updateEnvironment('day');
            let treeData = await getObjeto('c1');
            if (!treeData) treeData = { id: 'c1', nome: 'Árvore', tipo: 'cenario', tamanho: 2, imagem_url: 'img/arvore-1.png' };
            for(let i=0; i<15; i++) {
                const x = (Math.random() - 0.5) * size * 1.5;
                const z = (Math.random() - 0.5) * size * 1.5;
                addSpriteToBoard(Math.round(x/2)*2, Math.round(z/2)*2, treeData);
            }
        } else if (preset === 'city') {
            updateTerrainTexture('stone');
            updateEnvironment('afternoon');
            let boxData = await getObjeto('c3');
            let rockData = await getObjeto('c2');
            if (!boxData) boxData = { id: 'c3', nome: 'Baú', tipo: 'cenario', tamanho: 1, imagem_url: 'https://cdn-icons-png.flaticon.com/512/2910/2910795.png' };
            if (!rockData) rockData = { id: 'c2', nome: 'Pedra', tipo: 'cenario', tamanho: 1, imagem_url: 'https://cdn-icons-png.flaticon.com/512/356/356784.png' };
            for(let i=0; i<10; i++) {
                const x = (Math.random() - 0.5) * size * 1.5;
                const z = (Math.random() - 0.5) * size * 1.5;
                addSpriteToBoard(Math.round(x/2)*2, Math.round(z/2)*2, i % 2 === 0 ? boxData : rockData);
            }
        } else if (preset === 'desert') {
            updateTerrainTexture('custom', 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/terrain/grasslight-big.jpg');
            updateEnvironment('afternoon');
            let rockData = await getObjeto('c2');
            if (!rockData) rockData = { id: 'c2', nome: 'Pedra', tipo: 'cenario', tamanho: 1, imagem_url: 'https://cdn-icons-png.flaticon.com/512/356/356784.png' };
            for(let i=0; i<8; i++) {
                const x = (Math.random() - 0.5) * size * 1.5;
                const z = (Math.random() - 0.5) * size * 1.5;
                addSpriteToBoard(Math.round(x/2)*2, Math.round(z/2)*2, rockData);
            }
        }
    });

    // --- LOGICA DE CONFIGURAÇÃO ---
    document.getElementById('select-terrain').addEventListener('change', (e) => {
        const customContainer = document.getElementById('custom-texture-container');
        if (e.target.value === 'custom') {
            customContainer.classList.remove('hidden');
        } else {
            customContainer.classList.add('hidden');
            updateTerrainTexture(e.target.value);
        }
    });

    document.getElementById('btn-apply-texture').onclick = () => {
        const url = document.getElementById('input-terrain-url').value;
        if (url) updateTerrainTexture('custom', url);
    };

    document.getElementById('btn-apply-size').onclick = () => {
        const w = document.getElementById('map-width').value;
        const h = document.getElementById('map-height').value;
        updateMapSize(w, h);
    };

    document.getElementById('select-time').addEventListener('change', (e) => {
        updateEnvironment(e.target.value);
    });

    document.getElementById('btn-fechar-nota').addEventListener('click', () => {
        document.getElementById('nota-modal').classList.add('hidden');
    });

    document.getElementById('check-lock-scenery').addEventListener('change', (e) => {
        setSceneryLock(e.target.checked);
    });

    // --- LOGICA DE RECOLHER PAINEL ---
    const mainPanel = document.getElementById('main-panel');
    const btnTogglePanel = document.getElementById('btn-toggle-panel');
    btnTogglePanel.onclick = () => {
        mainPanel.classList.toggle('collapsed');
        btnTogglePanel.innerText = mainPanel.classList.contains('collapsed') ? '+' : '_';
    };

    // --- LOGICA DE ABAS DO PAINEL PRINCIPAL ---
    document.querySelectorAll('.main-tab-btn').forEach(btn => {
        btn.onclick = (e) => {
            const targetTab = e.target.dataset.mainTab;
            
            // Atualiza botões
            document.querySelectorAll('.main-tab-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');

            // Atualiza conteúdos
            document.querySelectorAll('.main-tab-content').forEach(c => c.classList.add('hidden'));
            document.getElementById(`tab-content-${targetTab}`).classList.remove('hidden');
        };
    });

    // --- LÓGICA DE MAPAS ---
    const mapsModal = document.getElementById('maps-modal');
    const mapsGrid = document.getElementById('maps-grid');

    async function renderMaps() {
        mapsGrid.innerHTML = '';
        const mapas = await getAllMapas();

        if (mapas.length === 0) {
            mapsGrid.innerHTML = '<p style="grid-column: span 3; text-align: center; color: #888; padding: 20px;">Nenhum mapa salvo.</p>';
            return;
        }

        mapas.forEach(mapa => {
            const div = document.createElement('div');
            div.className = 'library-item';
            div.style.padding = '15px';
            div.innerHTML = `
                <div style="font-size: 24px; margin-bottom: 5px;">🗺️</div>
                <span>${mapa.nome}</span>
                <button class="btn-delete-map" style="background: #c0392b; color: white; border: none; border-radius: 4px; padding: 4px 8px; font-size: 10px; margin-top: 10px; width: 100%;">Excluir</button>
            `;
            
            div.onclick = async (e) => {
                if (e.target.classList.contains('btn-delete-map')) {
                    const confirm = await customConfirm(`Excluir o mapa "${mapa.nome}"?`);
                    if (confirm) {
                        await deleteMapa(mapa.id);
                        renderMaps();
                    }
                    return;
                }
                loadMap(mapa.data);
                mapsModal.classList.add('hidden');
            };
            mapsGrid.appendChild(div);
        });
    }

    async function loadMap(mapData) {
        // 1. Limpa o mapa atual
        const toRemove = [];
        scene.children.forEach(child => {
            if (child.type === "SpriteGroup") toRemove.push(child);
        });
        toRemove.forEach(obj => scene.remove(obj));

        // 2. Restaura Ambiente
        document.getElementById('select-terrain').value = mapData.terrain;
        document.getElementById('select-time').value = mapData.time;
        document.getElementById('map-width').value = mapData.sizeW || 25;
        document.getElementById('map-height').value = mapData.sizeH || 25;
        
        updateTerrainTexture(mapData.terrain);
        updateEnvironment(mapData.time);
        updateMapSize(document.getElementById('map-width').value, document.getElementById('map-height').value);

        // 3. Recria Entidades
        for (const ent of mapData.entities) {
            const dbData = await getObjeto(ent.userData.id);
            const finalData = dbData || ent.userData;
            addSpriteToBoard(ent.x, ent.z, finalData);
        }
        await customAlert("Mapa carregado!");
    }

    document.getElementById('btn-save-new').addEventListener('click', async () => {
        const nome = await customPrompt("Nome do Mapa:");
        if (!nome) return;

        const mapData = {
            terrain: document.getElementById('select-terrain').value,
            time: document.getElementById('select-time').value,
            sizeW: document.getElementById('map-width').value,
            sizeH: document.getElementById('map-height').value,
            entities: []
        };

        scene.children.forEach(child => {
            if (child.type === "SpriteGroup") {
                mapData.entities.push({
                    x: child.position.x,
                    z: child.position.z,
                    userData: child.userData
                });
            }
        });

        await addMapa({ nome, data: mapData });
        await customAlert("Mapa salvo com sucesso!");
    });

    document.getElementById('btn-open-maps').onclick = () => {
        mapsModal.classList.remove('hidden');
        renderMaps();
    };

    document.getElementById('btn-close-maps').onclick = () => mapsModal.classList.add('hidden');
}

startApp();