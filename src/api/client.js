const Discogs = require('disconnect').Client;

const client = new Discogs('CustomSearcher/1.0.0', { userToken: 'NIkRQcrQAaPoScQZjoLXhUSmrGNjcapvdLzOIxWh' });

module.exports = client;