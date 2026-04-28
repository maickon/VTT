const db = new Dexie("VTT_Database");

db.version(1).stores({
    objetos: 'id, nome, tipo, cor, tamanho, imagem_url, categoria' 
});

export async function initDatabase() {
    const count = await db.objetos.count();

    const initialData = [
        // CRIATURAS - HERÓIS
        { id: 'h1', nome: 'Guerreiro', tipo: 'criatura', categoria: 'heroi', cor: '#3498db', tamanho: 1, imagem_url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/66.png' },
        { id: 'h2', nome: 'Maga', tipo: 'criatura', categoria: 'heroi', cor: '#9b59b6', tamanho: 1, imagem_url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/63.png' },

        // CRIATURAS - MONSTROS
        { id: 'm1', nome: 'Orc', tipo: 'criatura', categoria: 'monstro', cor: '#e74c3c', tamanho: 1, imagem_url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/56.png' },
        { id: 'm2', nome: 'Dragão', tipo: 'criatura', categoria: 'monstro', cor: '#c0392b', tamanho: 3, imagem_url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/6.png' },

        // CENÁRIO
        { id: 'c1', nome: 'Árvore Grande', tipo: 'cenario', categoria: 'item', cor: '#2ecc71', tamanho: 2, imagem_url: 'img/arvore-1.png' },
        { id: 'c2', nome: 'Pedra', tipo: 'cenario', categoria: 'item', cor: '#95a5a6', tamanho: 1, imagem_url: 'https://cdn-icons-png.flaticon.com/512/356/356784.png' },
        { id: 'c3', nome: 'Baú', tipo: 'cenario', categoria: 'item', cor: '#f39c12', tamanho: 1, imagem_url: 'https://cdn-icons-png.flaticon.com/512/2910/2910795.png' }
    ];

    if (count === 0) {
        await db.objetos.bulkAdd(initialData);
        console.log("Biblioteca inicial carregada.");
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