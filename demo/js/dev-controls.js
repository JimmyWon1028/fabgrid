import fabui from '../../src/fabui.js?v=20260719-button-anchor-v1';
import { mountFabUIDemoControls } from './demo-controls.js?v=20260720-hidden-file-input-v1';

window.setTimeout(function() {
  mountFabUIDemoControls(fabui, 'fabuiDevControls');
}, 0);
