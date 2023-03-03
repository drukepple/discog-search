const money = require('money');
const request = require('./request');
async function run() {
  const OXR_KEY = '402f86a53c044dd5a35bae913b06bb23';
  const ratesResult = await (request(`https://openexchangerates.org/api/latest.json?app_id=${OXR_KEY}`))
  const rates = JSON.parse(ratesResult);
  console.log(rates);
  money.base = rates.base;
  money.rates = rates.rates;
  try {
    const conversion = money.convert(60, {from: 'GBP', to: 'USD'})
    console.log(conversion);
  } catch(err) {
    console.log(err);
  }
}
run();