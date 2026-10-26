// Loaded only by the game frame. Reuse the parent's decoded sheet and scoped session.
(()=>{
 const session=parent!==window&&parent.BoukenRecommendationSession;
 if(!session){document.querySelector('main').textContent='パーティー編成画面から開いてください。';throw Error('No party session');}
 window.BoukenCharacterImages=parent.BoukenCharacterImages;
 window.PartyGameBridge=Object.freeze({read:session.read,apply:session.apply,close:session.close,workerURL:new URL('../tests/party-recommendation/integration/worker.js?rev=game71',document.currentScript.src).href,descriptionsURL:new URL('../data/skill_messages.json',document.currentScript.src).href});
})();
