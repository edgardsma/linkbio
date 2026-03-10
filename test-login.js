const bcrypt = require('bcryptjs');

// Testar hash do usuário teste@linkbio.com
const hash = '$2b$10$j/Oxj2Bbs7pbebObalLCJu.YhxKVBmKnVLaA06WaY9hgqcHsr8WYW';
const password = 'test123456';

const result = bcrypt.compareSync(password, hash);
console.log('Senha test123456 corresponde ao hash?', result);
console.log('Hash:', hash);
