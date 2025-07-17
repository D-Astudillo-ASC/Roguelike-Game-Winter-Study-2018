import { Display, RNG, Map, Scheduler, Engine } from 'rot-js';
import {Game} from './game.js';

window.onload = function() {
  console.log("starting WSRL - window loaded");
  // ROT.isSupported() is not needed in modern browsers, so we remove this check

  Game.init();

  // Add the containers to our HTML page
  document.getElementById('ws-main-display').appendChild(Game.getDisplay('main').getContainer());
  document.getElementById('ws-avatar-display').appendChild(Game.getDisplay('avatar').getContainer());
  document.getElementById('ws-message-display').appendChild(Game.getDisplay('message').getContainer());

  Game.bindEvent('keypress');
  Game.bindEvent('keydown');
  Game.bindEvent('keyup');
  Game.render();
};
