const db = new Dexie("VTT_Database");

db.version(2).stores({
    objetos: 'id, nome, tipo, cor, tamanho, imagem_url, categoria',
    mapas: '++id, nome, data'
});

export async function initDatabase() {
    const count = await db.objetos.count();

    const initialData = [
        // CRIATURAS - HERÓIS
        { id: 'h1', nome: 'Guerreiro', tipo: 'criatura', categoria: 'heroi', cor: '#3498db', tamanho: 1, imagem_url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/66.png' },
        { id: 'h2', nome: 'Maga', tipo: 'criatura', categoria: 'heroi', cor: '#9b59b6', tamanho: 1, imagem_url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/63.png' },
        { id: 'h3', nome: 'Arqueiro', tipo: 'criatura', categoria: 'heroi', cor: '#2ecc71', tamanho: 1, imagem_url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png' },
        { id: 'h4', nome: 'Paladino', tipo: 'criatura', categoria: 'heroi', cor: '#f1c40f', tamanho: 1, imagem_url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/4.png' },

        // CRIATURAS - MONSTROS
        { id: 'm1', nome: 'Orc', tipo: 'criatura', categoria: 'monstro', cor: '#e74c3c', tamanho: 1, imagem_url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/56.png' },
        { id: 'm2', nome: 'Dragão', tipo: 'criatura', categoria: 'monstro', cor: '#c0392b', tamanho: 3, imagem_url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/6.png' },
        { id: 'm3', nome: 'Esqueleto', tipo: 'criatura', categoria: 'monstro', cor: '#ecf0f1', tamanho: 1, imagem_url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/104.png' },
        { id: 'm4', nome: 'Troll', tipo: 'criatura', categoria: 'monstro', cor: '#27ae60', tamanho: 2, imagem_url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/68.png' },

        // CENÁRIO
        { id: 'c1', nome: 'Árvore Grande', tipo: 'cenario', categoria: 'item', cor: '#2ecc71', tamanho: 2, imagem_url: 'img/arvore-1.png' },
        { id: 'c2', nome: 'Pedra', tipo: 'cenario', categoria: 'item', cor: '#95a5a6', tamanho: 1, imagem_url: 'https://cdn-icons-png.flaticon.com/512/356/356784.png' },
        { id: 'c3', nome: 'Baú', tipo: 'cenario', categoria: 'item', cor: '#f39c12', tamanho: 1, imagem_url: 'https://cdn-icons-png.flaticon.com/512/2910/2910795.png' },
        { id: 'c4', nome: 'Fogueira', tipo: 'cenario', categoria: 'item', cor: '#e67e22', tamanho: 1, imagem_url: 'https://cdn-icons-png.flaticon.com/512/414/414614.png' },
        { id: 'c5', nome: 'Estátua', tipo: 'cenario', categoria: 'item', cor: '#bdc3c7', tamanho: 1, imagem_url: 'https://cdn-icons-png.flaticon.com/512/1036/1036734.png' }
    ];

    if (count === 0) {
        await db.objetos.bulkAdd(initialData);
        console.log("Biblioteca inicial carregada.");
    } else {
        // Garante que os itens padrão existam mesmo se a DB já existir
        for (const item of initialData) {
            const exists = await db.objetos.get(item.id);
            if (!exists) await db.objetos.add(item);
        }
    }
}

export async function getAllObjetos() {
    return await db.objetos.toArray();
}

export async function addNovoObjeto(objeto) {
    await db.objetos.add(objeto);
}

export async function deleteObjeto(id) {
    await db.objetos.delete(id);
}

export async function getObjeto(id) {
    return await db.objetos.get(id);
}

// MAPAS
export async function addMapa(mapa) {
    return await db.mapas.add(mapa);
}

export async function getAllMapas() {
    return await db.mapas.toArray();
}

export async function deleteMapa(id) {
    await db.mapas.delete(id);
}

export async function getMapa(id) {
    return await db.mapas.get(id);
}