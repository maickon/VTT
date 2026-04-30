const db = new Dexie("VTT_Database");

db.version(3).stores({
    objetos: 'id, nome, tipo, cor, tamanho, imagem_url, categoria, alcance_ataque',
    mapas: '++id, nome, data',
    terrenos: 'id, nome, url',
    modelos: 'id, nome, data'
});

db.version(4).stores({
    objetos: 'id, nome, tipo, cor, tamanho, imagem_url, categoria, alcance_ataque, deslocamento',
    mapas: '++id, nome, data',
    terrenos: 'id, nome, url',
    modelos: 'id, nome, data'
});

db.version(5).stores({
    objetos: 'id, nome, tipo, cor, tamanho, imagem_url, categoria, alcance_ataque, deslocamento, modo_chao',
    mapas: '++id, nome, data',
    terrenos: 'id, nome, url',
    modelos: 'id, nome, data'
});

export async function initDatabase() {
    const initialObjetos = [
        { id: 'h1', nome: 'Anão', tipo: 'criatura', categoria: 'heroi', cor: '#3498db', tamanho: 1, imagem_url: 'img/player1.png', alcance_ataque: 3, deslocamento: 9 },
        { id: 'h2', nome: 'Guerreiro', tipo: 'criatura', categoria: 'heroi', cor: '#9b59b6', tamanho: 1, imagem_url: 'img/player2.webp', alcance_ataque: 3, deslocamento: 9 },
        { id: 'h3', nome: 'Cavaleiro', tipo: 'criatura', categoria: 'heroi', cor: '#2ecc71', tamanho: 1, imagem_url: 'img/player3.webp', alcance_ataque: 3, deslocamento: 9 },
        { id: 'h4', nome: 'Cavaleira', tipo: 'criatura', categoria: 'heroi', cor: '#f1c40f', tamanho: 1, imagem_url: 'img/player4.png', alcance_ataque: 3, deslocamento: 9 },
        { id: 'h5', nome: 'Guerreiro', tipo: 'criatura', categoria: 'heroi', cor: '#f1c40f', tamanho: 1, imagem_url: 'img/player5.png', alcance_ataque: 3, deslocamento: 9 },
        { id: 'h6', nome: 'Templário', tipo: 'criatura', categoria: 'heroi', cor: '#f1c40f', tamanho: 1, imagem_url: 'img/player6.webp', alcance_ataque: 3, deslocamento: 9 },
        { id: 'h7', nome: 'Paladino', tipo: 'criatura', categoria: 'heroi', cor: '#f1c40f', tamanho: 1, imagem_url: 'img/player7.png', alcance_ataque: 3, deslocamento: 9 },
        { id: 'h8', nome: 'Assassino', tipo: 'criatura', categoria: 'heroi', cor: '#f1c40f', tamanho: 1, imagem_url: 'img/player8.png', alcance_ataque: 3, deslocamento: 9 },
        { id: 'h9', nome: 'Cavaleiro', tipo: 'criatura', categoria: 'heroi', cor: '#f1caa2', tamanho: 1, imagem_url: 'img/cavaleiro.png', alcance_ataque: 3, deslocamento: 9 },
        
        { id: 'm1', nome: 'Orc', tipo: 'criatura', categoria: 'monstro', cor: '#e74c3c', tamanho: 1, imagem_url: 'img/orc1.gif', alcance_ataque: 1, deslocamento: 6 },
        { id: 'm2', nome: 'Dragao Brilhoso', tipo: 'criatura', categoria: 'monstro', cor: '#c0392b', tamanho: 5, imagem_url: 'img/dragon1.png', alcance_ataque: 8, deslocamento: 12 },
        { id: 'm3', nome: 'Dragao Azul', tipo: 'criatura', categoria: 'monstro', cor: '#c0392b', tamanho: 5, imagem_url: 'img/dragon2.png', alcance_ataque: 8, deslocamento: 12 },
        { id: 'm4', nome: 'Dragao Verde', tipo: 'criatura', categoria: 'monstro', cor: '#c0392b', tamanho: 5, imagem_url: 'img/dragon3.png', alcance_ataque: 8, deslocamento: 12 },
        { id: 'm5', nome: 'Dragao Metálico', tipo: 'criatura', categoria: 'monstro', cor: '#c0392b', tamanho: 5, imagem_url: 'img/dragon4.png', alcance_ataque: 8, deslocamento: 12 },
        { id: 'm6', nome: 'Dragao Negro', tipo: 'criatura', categoria: 'monstro', cor: '#000000', tamanho: 5, imagem_url: 'img/dragon5.webp', alcance_ataque: 8, deslocamento: 12 },
        { id: 'm7', nome: 'Dragao Dourado', tipo: 'criatura', categoria: 'monstro', cor: '#000000', tamanho: 5, imagem_url: 'img/dragon6.png', alcance_ataque: 8, deslocamento: 12 },
        { id: 'm8', nome: 'Dragao Vermelho', tipo: 'criatura', categoria: 'monstro', cor: '#FF0000', tamanho: 5, imagem_url: 'img/dragon7.png', alcance_ataque: 8, deslocamento: 12 },
        { id: 'm8', nome: 'Tyrant Dragon', tipo: 'criatura', categoria: 'monstro', cor: '#FF0000', tamanho: 5, imagem_url: 'img/dragon8.png', alcance_ataque: 8, deslocamento: 12 },
        { id: 'm9', nome: 'Avenger Dragon', tipo: 'criatura', categoria: 'monstro', cor: '#FF0000', tamanho: 8, imagem_url: 'img/dragon9.png', alcance_ataque: 20, deslocamento: 15 },
        { id: 'm10', nome: 'Dragão Negro', tipo: 'criatura', categoria: 'monstro', cor: '#000000', tamanho: 10, imagem_url: 'img/dragon10.png', alcance_ataque: 25, deslocamento: 15 },
        { id: 'm11', nome: 'Dragão Negro', tipo: 'criatura', categoria: 'monstro', cor: '#000000', tamanho: 5, imagem_url: 'img/dragon11.png', alcance_ataque: 6, deslocamento: 12 },
        { id: 'm12', nome: 'Dragão Negro', tipo: 'criatura', categoria: 'monstro', cor: '#000000', tamanho: 6, imagem_url: 'img/dragon12.png', alcance_ataque: 10, deslocamento: 15 },
        { id: 'm13', nome: 'Dragão Negro', tipo: 'criatura', categoria: 'monstro', cor: '#000000', tamanho: 5, imagem_url: 'img/dragon13.png', alcance_ataque: 6, deslocamento: 12 },
        
        { id: 'm15', nome: 'Golem de Lava', tipo: 'criatura', categoria: 'monstro', cor: '#FF0000', tamanho: 2, imagem_url: 'img/monster2.webp', alcance_ataque: 6, deslocamento: 9 },
        { id: 'm16', nome: 'Anão Lutador', tipo: 'criatura', categoria: 'monstro', cor: '#FFAE40', tamanho: 2, imagem_url: 'img/monster3.webp', alcance_ataque: 6, deslocamento: 9 },
        { id: 'm17', nome: 'Repulsante', tipo: 'criatura', categoria: 'monstro', cor: '#FFAE40', tamanho: 2, imagem_url: 'img/monster4.png', alcance_ataque: 6, deslocamento: 9 },
        { id: 'm18', nome: 'Murgog', tipo: 'criatura', categoria: 'monstro', cor: '#00AE40', tamanho: 2, imagem_url: 'img/monster5.png', alcance_ataque: 3, deslocamento: 9 },
        { id: 'm19', nome: 'Golem de Pedra', tipo: 'criatura', categoria: 'monstro', cor: '#0FAE4F', tamanho: 2, imagem_url: 'img/mosnter1.webp', alcance_ataque: 6, deslocamento: 9 },
        { id: 'm20', nome: 'Guerreira da Luz', tipo: 'criatura', categoria: 'monstro', cor: '#FFFFAA', tamanho: 1, imagem_url: 'img/guerreira.png', alcance_ataque: 3, deslocamento: 9 },
        { id: 'm21', nome: 'Fly Dragon', tipo: 'criatura', categoria: 'monstro', cor: '#FF0000', tamanho: 3, imagem_url: 'img/red-dragon.gif', alcance_ataque: 3, deslocamento: 9 },

        

        { id: 'c1', nome: 'Arvore Grande 1', tipo: 'cenario', categoria: 'item', cor: '#2ecc71', tamanho: 2, imagem_url: 'img/arvore-1.png' },
        { id: 'c2', nome: 'Arvore Grande 2', tipo: 'cenario', categoria: 'item', cor: '#2ecc71', tamanho: 2, imagem_url: 'img/arvore1.gif' },
        { id: 'c3', nome: 'Arvore Grande 3', tipo: 'cenario', categoria: 'item', cor: '#2ecc71', tamanho: 2, imagem_url: 'img/arvore2.gif' },
        { id: 'c4', nome: 'Arvore Grande 4', tipo: 'cenario', categoria: 'item', cor: '#2ecc71', tamanho: 2, imagem_url: 'img/arvore3.gif' },
        { id: 'c5', nome: 'Arvore Grande 5', tipo: 'cenario', categoria: 'item', cor: '#2ecc71', tamanho: 2, imagem_url: 'img/arvore4.gif' },
        { id: 'c6', nome: 'Pedra 1', tipo: 'cenario', categoria: 'item', cor: '#95a5a6', tamanho: 1, imagem_url: 'img/pedra1.png' },
        { id: 'c7', nome: 'Pedra 2', tipo: 'cenario', categoria: 'item', cor: '#95a5a6', tamanho: 2, imagem_url: 'img/pedra2.png' },
        { id: 'c8', nome: 'Pedra 3', tipo: 'cenario', categoria: 'item', cor: '#95a5a6', tamanho: 3, imagem_url: 'img/pedra3.png' },
        { id: 'c9', nome: 'Baú', tipo: 'cenario', categoria: 'item', cor: '#f39c12', tamanho: 1, imagem_url: 'img/bau.png' },
        { id: 'c10', nome: 'Pedra Nevada 1', tipo: 'cenario', categoria: 'item', cor: '#FFFFFF', tamanho: 2, imagem_url: 'img/pedra-nevada1.webp' },
        { id: 'c11', nome: 'Pedra Nevada 2', tipo: 'cenario', categoria: 'item', cor: '#FFFFFF', tamanho: 2, imagem_url: 'img/pedra-nevada3.webp' },
        { id: 'c12', nome: 'Ávore Nevada 1', tipo: 'cenario', categoria: 'item', cor: '#FFFFFF', tamanho: 2, imagem_url: 'img/snow-tree1.webp' },
        { id: 'c13', nome: 'Ávore Nevada 2', tipo: 'cenario', categoria: 'item', cor: '#FFFFFF', tamanho: 2, imagem_url: 'img/snow-tree2.png' },
        { id: 'c14', nome: 'Ávore Nevada 3', tipo: 'cenario', categoria: 'item', cor: '#FFFFFF', tamanho: 2, imagem_url: 'img/snow-tree3.png' },
        { id: 'c15', nome: 'Ávore Nevada 4', tipo: 'cenario', categoria: 'item', cor: '#FFFFFF', tamanho: 2, imagem_url: 'img/snow-tree4.png' }, 
        { id: 'c16', nome: 'Buraco 1', tipo: 'cenario', categoria: 'item', cor: '#FFFFFF', tamanho: 3, imagem_url: 'img/lava-area1.png', modo_chao: true },
        { id: 'c17', nome: 'Buraco Médio 2', tipo: 'cenario', categoria: 'item', cor: '#FFFFFF', tamanho: 3, imagem_url: 'img/lava-area2.png', modo_chao: true },
        { id: 'c18', nome: 'Buraco Grande 2', tipo: 'cenario', categoria: 'item', cor: '#FFFFFF', tamanho: 6, imagem_url: 'img/lava-area2.png', modo_chao: true },
        { id: 'c19', nome: 'Buraco Médio 3', tipo: 'cenario', categoria: 'item', cor: '#FFFFFF', tamanho: 3, imagem_url: 'img/lava-area3.png', modo_chao: true },
        { id: 'c20', nome: 'Buraco Grande 3', tipo: 'cenario', categoria: 'item', cor: '#FFFFFF', tamanho: 6, imagem_url: 'img/lava-area3.png', modo_chao: true },
    ];

    const initialTerrenos = [
        { id: 'grass1', nome: 'Grama 1', url: 'img/grama1.jpg' },
        { id: 'grass2', nome: 'Grama 2', url: 'img/grama2.jpg' },
        { id: 'grass3', nome: 'Grama 3', url: 'img/grama3.jpg' },
        { id: 'grass4', nome: 'Grama 4', url: 'img/grama4.jpg' },
        { id: 'lava1', nome: 'Lava 1', url: 'img/lava1.jpg' },
        { id: 'lava2', nome: 'Lava 2', url: 'img/lava2.jpg' },
        { id: 'lava3', nome: 'Lava 3', url: 'img/lava3.jpg' },
        { id: 'stone1', nome: 'Pedra 1', url: 'img/terreno-pedra1.jpg' },
        { id: 'stone2', nome: 'Pedra 2', url: 'img/terreno-pedra2.jpg' },
        { id: 'stone3', nome: 'Pedra 3', url: 'img/terreno-pedra3.jpg' },
        { id: 'stone4', nome: 'Pedra 4', url: 'img/terreno-pedra4.jpg' },
        { id: 'stone5', nome: 'Pedra 5', url: 'img/terreno-pedra5.jpg' },
        { id: 'stone6', nome: 'Pedra 6', url: 'img/terreno-pedra6.jpg' },
        { id: 'snow1', nome: 'Neve 1', url: 'img/snow-1.jpeg' },
        { id: 'snow2', nome: 'Neve 2', url: 'img/snow-2.jpeg' }
    ];

    const initialModelos = [
        {
            id: 'forest',
            nome: 'Floresta Padrao',
            data: {
                terrain: 'grass1',
                time: 'day',
                sizeW: 25,
                sizeH: 25,
                bgUrl: 'img/bg1.jpeg',
                entities: [
                    { x: -4, z: -4, userData: { id: 'c1', nome: 'Arvore Grande', tipo: 'cenario', categoria: 'item', tamanho: 2 } },
                    { x: 6, z: 2, userData: { id: 'c1', nome: 'Arvore Grande', tipo: 'cenario', categoria: 'item', tamanho: 2 } },
                    { x: -2, z: 8, userData: { id: 'c2', nome: 'Pedra', tipo: 'cenario', categoria: 'item', tamanho: 1 } },
                    { x: 8, z: -6, userData: { id: 'c1', nome: 'Arvore Grande', tipo: 'cenario', categoria: 'item', tamanho: 2 } }
                ]
            }
        },
        {
            id: 'city',
            nome: 'Cidade Padrao',
            data: {
                terrain: 'stone',
                time: 'afternoon',
                sizeW: 25,
                sizeH: 25,
                bgUrl: 'img/bg3.jpeg',
                entities: [
                    { x: 0, z: 0, userData: { id: 'c3', nome: 'Bau', tipo: 'cenario', categoria: 'item', tamanho: 1 } },
                    { x: 4, z: 4, userData: { id: 'c2', nome: 'Pedra', tipo: 'cenario', categoria: 'item', tamanho: 1 } }
                ]
            }
        },
        {
            id: 'desert',
            nome: 'Deserto Padrao',
            data: {
                terrain: 'custom',
                time: 'afternoon',
                sizeW: 25,
                sizeH: 25,
                bgUrl: 'img/bg2.jpeg',
                entities: [
                    { x: -10, z: -10, userData: { id: 'c2', nome: 'Pedra', tipo: 'cenario', categoria: 'item', tamanho: 1 } },
                    { x: 10, z: 10, userData: { id: 'c2', nome: 'Pedra', tipo: 'cenario', categoria: 'item', tamanho: 1 } }
                ]
            }
        },
        {
            id: 'ice-desert',
            nome: 'Deserto Gelado',
            data: {
                terrain: 'snow2',
                time: 'afternoon',
                sizeW: 40,
                sizeH: 40,
                bgUrl: 'img/bg7.jpg',
                entities: [
                    { x: -10, z: -10, userData: { id: 'c6', nome: 'Pedra', tipo: 'cenario', categoria: 'item', tamanho: 2 } },
                    { x: 10, z: 10, userData: { id: 'c7', nome: 'Pedra', tipo: 'cenario', categoria: 'item', tamanho: 2 } }
                ]
            }
        },
        {
            id: 'vulcan',
            nome: 'Dentro do Vulcão',
            data: {
                terrain: 'lava3',
                time: 'afternoon',
                sizeW: 80,
                sizeH: 80,
                bgUrl: 'img/bg8.webp',
                entities: [
                    { x: -10, z: -10, userData: { id: 'c6', nome: 'Pedra', tipo: 'cenario', categoria: 'item', tamanho: 2 } },
                    { x: 10, z: 10, userData: { id: 'c7', nome: 'Pedra', tipo: 'cenario', categoria: 'item', tamanho: 2 } }
                ]
            }
        }
    ];

    await db.transaction('rw', db.objetos, db.terrenos, db.modelos, async () => {
        await db.objetos.bulkPut(initialObjetos);
        await db.terrenos.bulkPut(initialTerrenos);
        await db.modelos.bulkPut(initialModelos);

        await db.objetos
            .filter(obj => (obj.tipo === 'criatura' || obj.categoria === 'heroi' || obj.categoria === 'monstro') && !obj.deslocamento)
            .modify({ deslocamento: 6 });
    });
}

export async function getAllObjetos() { return await db.objetos.toArray(); }
export async function addNovoObjeto(objeto) { await db.objetos.put(objeto); }
export async function deleteObjeto(id) { await db.objetos.delete(id); }
export async function getObjeto(id) { return await db.objetos.get(id); }
export async function addMapa(mapa) { return await db.mapas.add(mapa); }
export async function getAllMapas() { return await db.mapas.toArray(); }
export async function deleteMapa(id) { await db.mapas.delete(id); }
export async function getMapa(id) { return await db.mapas.get(id); }
export async function getAllTerrenos() { return await db.terrenos.toArray(); }
export async function addTerreno(terreno) { await db.terrenos.put(terreno); }
export async function deleteTerreno(id) { await db.terrenos.delete(id); }
export async function getAllModelos() { return await db.modelos.toArray(); }
export async function addModelo(modelo) { await db.modelos.put(modelo); }
export async function deleteModelo(id) { await db.modelos.delete(id); }
export async function getModelo(id) { return await db.modelos.get(id); }
