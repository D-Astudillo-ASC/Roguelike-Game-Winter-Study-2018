// Factory system for creating entities
import { DATASTORE } from "../core/DataStore.js";

export class Factory {
  constructor(productClass, datastoreNamespace) {
    this.productClass = productClass;
    this.datastoreNamespace = datastoreNamespace;
    this.knownTemplates = {};
  }

  // Learn a new template
  learn(template) {
    const templateName = template.templateName
      ? template.templateName
      : template.name;
    this.knownTemplates[templateName] = template;
  }

  // Create a product from a template
  create(templateName) {
    const template = this.knownTemplates[templateName];
    if (!template) {
      console.error(`Template '${templateName}' not found`);
      return null;
    }

    const product = new this.productClass(template);

    // Add to datastore
    if (product && product.getId()) {
      DATASTORE[this.datastoreNamespace][product.getId()] = product;
    }

    return product;
  }

  // Get all known template names
  getTemplateNames() {
    return Object.keys(this.knownTemplates);
  }

  // Get a template by name
  getTemplate(templateName) {
    return this.knownTemplates[templateName] || null;
  }

  // Check if a template exists
  hasTemplate(templateName) {
    return templateName in this.knownTemplates;
  }
}
