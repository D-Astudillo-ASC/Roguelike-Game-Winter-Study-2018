// factory system, objects that create other objects

import { DATASTORE } from "./datastore.js";

export class Factory {
  constructor(productClass, datastoreNamespace) {
    this.productClass = productClass;
    this.datastoreNamespace = datastoreNamespace;
    this.knownTemplates = {};
  }

  learn(template) {
    this.knownTemplates[
      template.templateName ? template.templateName : template.name
    ] = template;
  }

  create(templateName) {
    const product = new this.productClass(this.knownTemplates[templateName]);

    DATASTORE[this.datastoreNamespace][product.getId()] = product;

    return product;
  }
}
