const crypto = require('crypto');

const password = '123456';
const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
console.log('Password hash:', hashedPassword);

const goodsTypeMultiplier = {
  'normal': 1.0,
  'fresh': 1.5,
  'electronics': 1.3,
  'dangerous': 2.0,
  'valuable': 2.5,
  'large': 1.8
};

const goodsTypeMultiplierStr = JSON.stringify(goodsTypeMultiplier);
console.log('Multiplier string:', goodsTypeMultiplierStr);

const parsed = JSON.parse(goodsTypeMultiplierStr);
console.log('Parsed multiplier:', parsed);
