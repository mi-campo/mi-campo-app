// Uso:
//   node src/seed.js admin "Fran" "fran" "unaClaveSegura123"
//   node src/seed.js productor "Juan Pérez" "juan" "otraClave456" ID_DEL_CLIENTE
//
// El ID_DEL_CLIENTE es el id del cliente/productor tal como figura en data/data.json
// (dentro de la lista "clientes"). Para admin no hace falta ese último dato.

const { loadUsers, saveUsers, load, uid } = require('./db');
const { hashPassword } = require('./auth');

const [, , rol, nombre, usuario, password, clienteId] = process.argv;

if (!rol || !nombre || !usuario || !password) {
  console.log('Uso: node src/seed.js <admin|productor> "<nombre>" "<usuario>" "<contraseña>" [clienteId]');
  process.exit(1);
}

if (rol === 'productor' && !clienteId) {
  console.log('Para un productor hace falta el clienteId. Estos son los clientes actuales:');
  const data = load();
  data.clientes.forEach(c => console.log(`  ${c.id} — ${c.nombre}`));
  process.exit(1);
}

const users = loadUsers();
if (users.find(u => u.usuario.toLowerCase() === usuario.toLowerCase())) {
  console.log(`Ya existe un usuario con el nombre "${usuario}".`);
  process.exit(1);
}

users.push({
  id: uid(),
  nombre,
  usuario,
  passwordHash: hashPassword(password),
  rol,
  clienteId: rol === 'productor' ? clienteId : null,
});
saveUsers(users);

console.log(`Usuario creado: ${usuario} (${rol})`);
