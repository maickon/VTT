import { 
    initDatabase, getObjeto, getAllObjetos, addNovoObjeto, deleteObjeto,
    addMapa, getAllMapas, deleteMapa, getMapa,
    getAllTerrenos, addTerreno, deleteTerreno,
    getAllModelos, addModelo, deleteModelo, getModelo
} from './database.js';
import { initEngine, ground, updateEnvironment, updateMapSize, updateTerrainTexture, updateBackground, scene } from './engine.js';
import { initInteractions, setPlacingMode, setEntity, getSelectedObject, setSceneryLock } from './interactions.js';
import { addSpriteToBoard, toggleStatusToGroup } from './entities.js';

// --- CUSTOM MODALS SYSTEM ---
const modalContainer = document.getElementById('custom-modal-container');
if (modalContainer) modalContainer.classList.add('hidden');
const modalTitle = document.getElementById('custom-modal-title');
const modalMessage = document.getElementById('custom-modal-message');
const modalInput = document.getElementById('custom-modal-input');
const btnOk = document.getElementById('custom-modal-btn-ok');
const btnCancel = document.getElementById('custom-modal-btn-cancel');

function showCustomModal(title, message, isPrompt = false, isConfirm = false) {
    return new Promise((resolve) => {
        if (!modalContainer) return resolve(null);
        // Fecha qualquer modal que já esteja aberto antes de mostrar o novo
        modalContainer.style.setProperty('display', 'none', 'important');
        
        // Pequeno delay para garantir que o DOM processe a troca se necessário
        setTimeout(() => {
            modalTitle.innerText = title;
            modalMessage.innerText = message;
            modalContainer.classList.remove('hidden');
            modalContainer.style.setProperty('display', 'flex', 'important');
            if (isPrompt) { modalInput.classList.remove('hidden'); modalInput.value = ''; setTimeout(() => modalInput.focus(), 100); } else { modalInput.classList.add('hidden'); }
            if (isConfirm || isPrompt) { btnCancel.classList.remove('hidden'); } else { btnCancel.classList.add('hidden'); }
            btnOk.onclick = () => { const val = isPrompt ? modalInput.value : true; modalContainer.classList.add('hidden'); modalContainer.style.setProperty('display', 'none', 'important'); resolve(val); };
            btnCancel.onclick = () => { modalContainer.classList.add('hidden'); modalContainer.style.setProperty('display', 'none', 'important'); resolve(null); };
        }, 10);
    });
}

window.customAlert = (msg) => showCustomModal("Aviso", msg);
window.customConfirm = (msg) => showCustomModal("Confirmação", msg, false, true);
window.customPrompt = (msg) => showCustomModal("Entrada", msg, true);

window.toggleStatus = (type) => {
    const selected = getSelectedObject();
    if (selected) {
        toggleStatusToGroup(selected, type);
        const cm = document.getElementById('context-menu');
        if (cm) cm.classList.add('hidden');
    }
};

async function startApp() {
    // Garantir que modais comecem fechados (Fail-safe)
    const libModal = document.getElementById('library-modal');
    if (libModal) libModal.style.setProperty('display', 'none', 'important');
    if (modalContainer) modalContainer.style.setProperty('display', 'none', 'important');

    await initDatabase(); 
    initEngine();         
    initInteractions();   

    // --- POPULAR SELECTS ---
    async function updateSelects() {
        const selTerr = document.getElementById('select-terrain');
        const selMod = document.getElementById('select-preset');
        
        // Terrenos
        const terrenos = await getAllTerrenos();
        selTerr.innerHTML = '';
        terrenos.forEach(t => {
            const opt = document.createElement('option');
            opt.value = t.id;
            opt.textContent = t.nome;
            opt.dataset.url = t.url;
            selTerr.appendChild(opt);
        });
        const optCustom = document.createElement('option');
        optCustom.value = 'custom'; optCustom.textContent = 'URL Imagem';
        selTerr.appendChild(optCustom);

        // Modelos
        const modelos = await getAllModelos();
        selMod.innerHTML = '<option value="empty">Mapa Vazio</option>';
        modelos.forEach(m => {
            const opt = document.createElement('option');
            opt.value = m.id;
            opt.textContent = m.nome;
            selMod.appendChild(opt);
        });
    }
    await updateSelects();

    // --- LOGICA DA BIBLIOTECA ---
    const libGrid = document.getElementById('library-grid');
    const newItemForm = document.getElementById('new-item-form');
    let currentLibTab = 'heroi';

    async function renderLibrary() {
        if (!libGrid) return;
        libGrid.innerHTML = '';
        const todos = await getAllObjetos();
        const filtrados = todos.filter(item => item.categoria === currentLibTab);
        if (filtrados.length === 0) libGrid.innerHTML = '<p style="grid-column: span 3; text-align: center; color: #888; padding: 20px;">Vazio.</p>';

        filtrados.forEach(item => {
            const div = document.createElement('div');
            div.className = 'library-item';
            div.style.position = 'relative';
            let delBtn = String(item.id).startsWith('custom_') ? `<button class="btn-delete-item" style="position: absolute; top: 5px; right: 5px; background: #c0392b; color: white; border: none; border-radius: 50%; width: 20px; height: 20px; font-size: 10px; cursor: pointer;">X</button>` : '';
            const deslocamentoInfo = item.tipo === 'criatura' ? ` | ${item.deslocamento || 6}q` : '';
            div.innerHTML = `${delBtn}<img src="${item.imagem_url}" onerror="this.src='https://cdn-icons-png.flaticon.com/512/1695/1695213.png'"><span>${item.nome}</span><small>${item.tamanho}x${item.tamanho}${deslocamentoInfo}</small>`;
            div.onclick = async (e) => {
                if (e.target.classList.contains('btn-delete-item')) {
                    if (await customConfirm(`Excluir "${item.nome}"?`)) { await deleteObjeto(item.id); renderLibrary(); }
                    return;
                }
                setPlacingMode(true);
                setEntity(item);
                libModal.classList.add('hidden');
                libModal.style.setProperty('display', 'none', 'important');
                document.getElementById('vtt-canvas').style.cursor = 'crosshair';
            };
            libGrid.appendChild(div);
        });
    }

    document.getElementById('btn-open-library').onclick = () => { 
        libModal.classList.remove('hidden');
        libModal.style.setProperty('display', 'flex', 'important'); 
        renderLibrary(); 
    };
    document.getElementById('btn-close-library').onclick = () => {
        libModal.classList.add('hidden');
        libModal.style.setProperty('display', 'none', 'important');
    };

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.onclick = (e) => {
            const tab = e.target.dataset.tab;
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            if (tab === 'novo') { libGrid.classList.add('hidden'); newItemForm.classList.remove('hidden'); } 
            else { currentLibTab = tab; libGrid.classList.remove('hidden'); newItemForm.classList.add('hidden'); renderLibrary(); }
        };
    });

    document.getElementById('btn-create-item').onclick = async () => {
        const novo = {
            id: 'custom_' + Date.now(),
            nome: document.getElementById('new-nome').value,
            tipo: document.getElementById('new-tipo').value,
            categoria: document.getElementById('new-categoria').value,
            tamanho: parseInt(document.getElementById('new-tamanho').value),
            alcance_ataque: parseInt(document.getElementById('new-alcance').value) || 1,
            deslocamento: parseInt(document.getElementById('new-deslocamento').value) || 6,
            imagem_url: document.getElementById('new-imagem').value,
            cor: document.getElementById('new-cor').value
        };
        if (novo.tipo !== 'criatura' && novo.categoria === 'item') novo.deslocamento = 0;
        if (!novo.nome || !novo.imagem_url) return customAlert("Dados incompletos!");
        await addNovoObjeto(novo);
        await customAlert("Salvo!");
        document.querySelector(`[data-tab="${novo.categoria}"]`).click();
    };

    // --- LOGICA DE MODELOS (PRESETS) ---
    document.getElementById('select-preset').addEventListener('change', async (e) => {
        const presetId = e.target.value;
        if (presetId === 'empty') {
            const toRemove = [];
            scene.children.forEach(child => { if (child.type === "SpriteGroup") toRemove.push(child); });
            toRemove.forEach(obj => scene.remove(obj));
            return;
        }
        const modelo = await getModelo(presetId);
        if (modelo) loadMap(modelo.data);
    });

    // --- LOGICA DE CONFIGURAÇÃO ---
    document.getElementById('select-terrain').addEventListener('change', (e) => {
        const opt = e.target.options[e.target.selectedIndex];
        if (e.target.value === 'custom') {
            document.getElementById('custom-texture-container').classList.remove('hidden');
        } else {
            document.getElementById('custom-texture-container').classList.add('hidden');
            updateTerrainTexture(e.target.value, opt.dataset.url);
        }
    });

    document.getElementById('btn-apply-texture').onclick = () => updateTerrainTexture('custom', document.getElementById('input-terrain-url').value);
    document.getElementById('btn-apply-size').onclick = () => updateMapSize(document.getElementById('map-width').value, document.getElementById('map-height').value);
    document.getElementById('select-time').addEventListener('change', (e) => updateEnvironment(e.target.value));
    
    document.getElementById('btn-apply-bg').onclick = () => updateBackground(document.getElementById('input-bg-url').value);

    document.getElementById('check-lock-scenery').addEventListener('change', (e) => {
        setSceneryLock(e.target.checked);
    });

    // --- GESTÃO DE ASSETS ---
    const assetsModal = document.getElementById('assets-modal');
    const assetsGrid = document.getElementById('assets-grid');
    const assetForm = document.getElementById('new-asset-form');
    let currentAssetTab = 'terreno';

    async function renderAssets() {
        assetsGrid.innerHTML = '';
        const list = currentAssetTab === 'terreno' ? await getAllTerrenos() : await getAllModelos();
        list.forEach(item => {
            const div = document.createElement('div');
            div.className = 'library-item';
            div.style.position = 'relative';
            
            // Botões de ação apenas para itens customizados (opcional, aqui faremos para todos)
            div.innerHTML = `
                <div class="asset-actions">
                    <button class="btn-asset-action btn-edit-asset" title="Editar">✎</button>
                    <button class="btn-asset-action btn-del-asset" title="Excluir">X</button>
                </div>
                <div style="font-size:30px; margin-bottom:10px;">${currentAssetTab === 'terreno' ? '⛰️' : '🗺️'}</div>
                <span>${item.nome}</span>
            `;

            div.onclick = async (e) => {
                if (e.target.classList.contains('btn-del-asset')) {
                    if (await customConfirm(`Excluir "${item.nome}"?`)) {
                        if (currentAssetTab === 'terreno') await deleteTerreno(item.id); else await deleteModelo(item.id);
                        renderAssets(); await updateSelects();
                    }
                    return;
                }
                
                if (e.target.classList.contains('btn-edit-asset')) {
                    document.getElementById('edit-asset-id').value = item.id;
                    document.getElementById('new-asset-nome').value = item.nome;
                    if (currentAssetTab === 'terreno') {
                        document.getElementById('new-asset-url').value = item.url || '';
                    } else {
                        document.getElementById('new-asset-bg').value = item.data.bgUrl || '';
                    }
                    assetForm.classList.remove('hidden');
                    assetsGrid.classList.add('hidden');
                    document.getElementById('asset-form-title').innerText = "Editar " + (currentAssetTab === 'terreno' ? 'Terreno' : 'Modelo');
                    return;
                }

                // Clique normal: aplicar asset
                if (currentAssetTab === 'terreno') {
                    updateTerrainTexture('custom', item.url);
                    document.getElementById('select-terrain').value = 'custom';
                    document.getElementById('input-terrain-url').value = item.url || '';
                    document.getElementById('custom-texture-container').classList.remove('hidden');
                } else {
                    loadMap(item.data);
                }
                assetsModal.classList.add('hidden');
            };
            assetsGrid.appendChild(div);
        });
    }

    document.getElementById('btn-open-assets').onclick = () => { assetsModal.classList.remove('hidden'); renderAssets(); };
    document.getElementById('btn-close-assets').onclick = () => assetsModal.classList.add('hidden');

    document.querySelectorAll('.tab-btn-asset').forEach(btn => {
        btn.onclick = (e) => {
            currentAssetTab = e.target.dataset.assetTab;
            document.querySelectorAll('.tab-btn-asset').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            assetForm.classList.add('hidden'); assetsGrid.classList.remove('hidden');
            document.getElementById('edit-asset-id').value = '';
            document.getElementById('asset-form-title').innerText = currentAssetTab === 'terreno' ? 'Novo Terreno' : 'Novo Modelo (Template)';
            document.getElementById('label-asset-url').innerText = currentAssetTab === 'terreno' ? 'URL da Imagem:' : 'Dica: Modelos salvam o estado atual do mapa';
            
            if (currentAssetTab === 'modelo') {
                document.getElementById('new-asset-url').classList.add('hidden'); 
                document.getElementById('container-asset-bg').classList.remove('hidden');
            } else {
                document.getElementById('new-asset-url').classList.remove('hidden');
                document.getElementById('container-asset-bg').classList.add('hidden');
            }
            renderAssets();
        };
    });

    document.getElementById('btn-show-asset-form').onclick = () => { 
        document.getElementById('edit-asset-id').value = '';
        document.getElementById('new-asset-nome').value = '';
        document.getElementById('new-asset-url').value = '';
        document.getElementById('new-asset-bg').value = '';
        assetForm.classList.toggle('hidden'); 
        assetsGrid.classList.toggle('hidden'); 
    };

    document.getElementById('btn-create-asset').onclick = async () => {
        const idEdit = document.getElementById('edit-asset-id').value;
        const nomeInput = document.getElementById('new-asset-nome');
        const urlInput = document.getElementById('new-asset-url');
        const bgInput = document.getElementById('new-asset-bg');
        
        const nome = nomeInput.value;
        const url = urlInput.value;
        const bgUrl = bgInput.value;

        if (!nome) return customAlert("Nome obrigatório!");

        if (currentAssetTab === 'terreno') {
            const id = idEdit || 't_' + Date.now();
            await addTerreno({ id, nome, url });
        } else {
            let data;
            if (idEdit) {
                // Se estiver editando, mantém os dados originais e só muda nome/bg
                const original = await getModelo(idEdit);
                data = original.data;
                if (bgUrl) data.bgUrl = bgUrl;
            } else {
                data = getCurrentMapData();
                if (bgUrl) data.bgUrl = bgUrl;
            }
            await addModelo({ id: idEdit || 'm_' + Date.now(), nome, data });
        }
        await customAlert(idEdit ? "Atualizado!" : "Adicionado!");
        nomeInput.value = '';
        urlInput.value = '';
        bgInput.value = '';
        document.getElementById('edit-asset-id').value = '';
        assetForm.classList.add('hidden'); assetsGrid.classList.remove('hidden');
        renderAssets(); await updateSelects();
    };

    // --- MAPAS ---
    const mapsModal = document.getElementById('maps-modal');
    const mapsGrid = document.getElementById('maps-grid');

    function getCurrentMapData() {
        const data = {
            terrain: document.getElementById('select-terrain').value,
            time: document.getElementById('select-time').value,
            sizeW: document.getElementById('map-width').value,
            sizeH: document.getElementById('map-height').value,
            bgUrl: document.getElementById('input-bg-url').value,
            entities: []
        };
        scene.children.forEach(child => {
            if (child.type === "SpriteGroup") data.entities.push({ x: child.position.x, z: child.position.z, userData: child.userData });
        });
        return data;
    }

    async function loadMap(mapData, silent = false) {
        const toRemove = [];
        scene.children.forEach(child => { if (child.type === "SpriteGroup") toRemove.push(child); });
        toRemove.forEach(obj => scene.remove(obj));

        document.getElementById('select-terrain').value = mapData.terrain;
        document.getElementById('select-time').value = mapData.time;
        document.getElementById('map-width').value = mapData.sizeW || 25;
        document.getElementById('map-height').value = mapData.sizeH || 25;
        document.getElementById('input-bg-url').value = mapData.bgUrl || '';
        
        const terrainOption = document.getElementById('select-terrain').selectedOptions[0];
        updateTerrainTexture(mapData.terrain, terrainOption?.dataset?.url);
        updateEnvironment(mapData.time);
        updateMapSize(mapData.sizeW, mapData.sizeH);
        updateBackground(mapData.bgUrl);

        for (const ent of mapData.entities) {
            const dbData = await getObjeto(ent.userData.id);
            addSpriteToBoard(ent.x, ent.z, dbData || ent.userData);
        }
        if (!silent) await customAlert("Mapa carregado!");
    }

    document.getElementById('btn-save-new').onclick = async () => {
        const nome = await customPrompt("Nome do Mapa:");
        if (nome) { await addMapa({ nome, data: getCurrentMapData() }); await customAlert("Salvo!"); }
    };

    document.getElementById('btn-open-maps').onclick = async () => {
        mapsModal.classList.remove('hidden');
        mapsGrid.innerHTML = '';
        const mapas = await getAllMapas();
        if (mapas.length === 0) mapsGrid.innerHTML = '<p style="grid-column: span 3; text-align: center; color: #888; padding: 20px;">Vazio.</p>';
        mapas.forEach(mapa => {
            const div = document.createElement('div');
            div.className = 'library-item';
            div.innerHTML = `<div style="font-size:24px;">🗺️</div><span>${mapa.nome}</span><button class="btn-delete-map" style="background:#c0392b; color:white; border:none; border-radius:4px; padding:4px 8px; font-size:10px; margin-top:10px; width:100%;">Excluir</button>`;
            div.onclick = async (e) => {
                if (e.target.classList.contains('btn-delete-map')) {
                    if (await customConfirm("Excluir?")) { await deleteMapa(mapa.id); div.remove(); }
                } else { loadMap(mapa.data); mapsModal.classList.add('hidden'); }
            };
            mapsGrid.appendChild(div);
        });
    };
    document.getElementById('btn-close-maps').onclick = () => mapsModal.classList.add('hidden');
    
    // Panel logic
    document.getElementById('btn-toggle-panel').onclick = () => {
        const p = document.getElementById('main-panel');
        p.classList.toggle('collapsed');
        document.getElementById('btn-toggle-panel').innerText = p.classList.contains('collapsed') ? '+' : '_';
    };
    document.querySelectorAll('.main-tab-btn').forEach(btn => {
        btn.onclick = (e) => {
            const target = e.target.dataset.mainTab;
            document.querySelectorAll('.main-tab-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            document.querySelectorAll('.main-tab-content').forEach(c => c.classList.add('hidden'));
            document.getElementById(`tab-content-${target}`).classList.remove('hidden');
        };
    });
}
startApp();
