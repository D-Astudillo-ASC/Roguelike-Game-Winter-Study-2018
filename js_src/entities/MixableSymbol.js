import { DisplaySymbol } from "../world/DisplaySymbol.js";
import { MixinRegistry } from "./mixins/MixinRegistry.js";

export class MixableSymbol extends DisplaySymbol {
  constructor(template, mixinMap = null) {
    super(template);
    // Set the name early so mixins can access it during initialization
    this.name = template.name;
    if (!this.state) {
      this.state = {};
    }

    this.mixins = [];
    this.mixinTracker = {};

    if (template.mixInNames) {
      for (let mi = 0; mi < template.mixInNames.length; mi++) {
        const mixinName = template.mixInNames[mi];
        const mixin = mixinMap ? mixinMap[mixinName] : MixinRegistry[mixinName];
        if (mixin) {
          this.mixins.push(mixin);
          this.mixinTracker[mixinName] = true;
        }
      }
    }

    for (let mi = 0; mi < this.mixins.length; mi++) {
      const m = this.mixins[mi];
      // console.log("Adding mixin:", m.META.mixInName, "to entity:", this.name);
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
        // console.log("call initializer for" + m.META.mixInName);
        m.META.initialize.call(this, template);
      }
    }
  }

  raiseMixinEvent(evtLabel, evtData) {
    // console.log("raiseMixinEvent called for:", this.name, "event:", evtLabel);
    // console.log("Number of mixins:", this.mixins.length);
    for (let mi = 0; mi < this.mixins.length; mi++) {
      const m = this.mixins[mi];
      // console.log(
      //   "Checking mixin:",
      //   m.META.mixInName,
      //   "has listeners:",
      //   !!m.LISTENERS,
      //   "has event:",
      //   !!m.LISTENERS?.[evtLabel],
      // );
      if (m.LISTENERS && m.LISTENERS[evtLabel]) {
        // console.log(
        //   "Calling listener for:",
        //   m.META.mixInName,
        //   "event:",
        //   evtLabel,
        // );
        m.LISTENERS[evtLabel].call(this, evtData);
      }
    }
  }
} 