import { DisplaySymbol } from "./display_symbol.js";
import * as E from "./entity_mixins.js";

export class MixableSymbol extends DisplaySymbol {
  constructor(template) {
    super(template);
    if (!this.state) {
      this.state = {};
    }

    this.mixins = [];
    this.mixinTracker = {};

    if (template.mixInNames) {
      for (let mi = 0; mi < template.mixInNames.length; mi++) {
        this.mixins.push(E[template.mixInNames[mi]]);
        this.mixinTracker[template.mixInNames[mi]] = true;
      }
    }

    for (let mi = 0; mi < this.mixins.length; mi++) {
      const m = this.mixins[mi];
      console.log(m);
      if (m.META.stateNamespace) {
        this.state[m.META.stateNamespace] = {};
      }

      if (m.META.stateModel) {
        for (const sbase in m.META.stateModel) {
          this.state[m.META.stateNamespace][sbase] = m.META.stateModel[sbase];
        }
      }

      for (const method in m.METHODS) {
        if (m.METHODS) {
          this[method] = m.METHODS[method];
        }
      }
    }

    for (let mi = 0; mi < this.mixins.length; mi++) {
      const m = this.mixins[mi];
      if (m.META.initialize) {
        console.log("call initializer for" + m.META.mixInName);
        m.META.initialize.call(this, template);
      }
    }
  }

  raiseMixinEvent(evtLabel, evtData) {
    for (let mi = 0; mi < this.mixins.length; mi++) {
      const m = this.mixins[mi];
      if (m.LISTENERS && m.LISTENERS[evtLabel]) {
        m.LISTENERS[evtLabel].call(this, evtData);
      }
    }
  }
}
