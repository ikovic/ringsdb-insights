const CORS_PROXY = 'https://cors-anywhere.herokuapp.com/';
const RINGSDB_API_URL = `${CORS_PROXY}https://ringsdb.com/api/public`;

function mapDeckToCards(deck) {
  return { ...deck.heroes, ...deck.slots };
}

function getCardSourceInfo(deckId) {
  let cards = {};

  return fetch(`${RINGSDB_API_URL}/decklist/${deckId}.json`, {
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then(response => response.json())
    .then(data => {
      cards = mapDeckToCards(data);
      return Promise.all(
        Object.keys(cards).map(cardId =>
          fetch(`${RINGSDB_API_URL}/card/${cardId}.json`, {
            headers: {
              'Content-Type': 'application/json',
            },
          })
        )
      );
    })
    .then(cardResponses => Promise.all(cardResponses.map(r => r.json())))
    .then(cardInfo => {
      const cardIndex = cardInfo.map(card => {
        const { code, pack_code, pack_name, url, imagesrc } = card;
        return {
          id: card.code,
          pack: pack_name,
          packId: pack_code,
          url,
          imagesrc,
          count: cards[code],
        };
      });

      return cardIndex;
    });
}

function initApp() {
  const formElement = document.querySelector('#deckForm');
  formElement.addEventListener('submit', event => {
    event.preventDefault();
    const deckUrl = document.querySelector('#deckIdInput').value;
    const deckIdRegex = /\d{5}/s;
    const deckId = deckIdRegex.test(deckUrl) ? deckUrl.match(deckIdRegex)[0] : null;

    if (deckId) {
      getCardSourceInfo(deckId).then(cardIndex => {
        const insights = cardIndex.reduce((aggregate, card) => {
          const pack = aggregate[card.packId];
          if (!pack) {
            return { ...aggregate, [card.packId]: { name: card.pack, cardsUsed: card.count } };
          } else {
            return {
              ...aggregate,
              [card.packId]: { ...pack, cardsUsed: pack.cardsUsed + card.count },
            };
          }
        }, {});

        // append to page
        const packList = document.createElement('ul');
        Object.values(insights).map(pack => {
          const { name, cardsUsed } = pack;
          const listItem = document.createElement('li');
          listItem.appendChild(document.createTextNode(`${name}: ${cardsUsed} cards`));
          packList.appendChild(listItem);
        });

        const insightsElement = document.querySelector('#insights');
        insightsElement.innerHTML = '';
        insightsElement.appendChild(packList);
      });
    } else {
      console.log('Invalid deck ID');
    }
  });
}

document.addEventListener('readystatechange', event => {
  if (event.target.readyState === 'complete') {
    initApp();
  }
});
