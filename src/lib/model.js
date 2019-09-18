/**
 * Validates a prop model against a value before setting it
 * Throws an error as soon as a check fails
 */
function validateProp(prop, model, value) {
  const types = model.type;

  // Type checking
  if (value != null && !types.some(t => Object.getPrototypeOf(value) == t.prototype)) {
    throw new Error(`Type error in prop '${prop}'.`);
  }

  // Custom validator check
  if (model.validator && !model.validator(value)) {
    throw new Error(`Validation error in prop '${prop}'.`);
  }
};

/**
 * Parses props object into something the validator can handle
 */
function parseProps(props) {
  return Object.entries(props)
    .map(pair => {
      const [ key, obj ] = pair;

      if (typeof obj == 'function' || Array.isArray(obj)) {
        pair[1] = { type: obj };
      } else if (typeof obj != 'object') {
        throw new Error(`Prop type invalid for prop ${key}.`);
      }

      return pair;
    })
    .reduce((acc, [ key, model ]) => {
      const { validator } = model;
      const types = Array.isArray(model.type) ? model.type : [model.type];
      const defType = typeof model.default;
      let def;

      // Validate types
      if (!types.every(t => typeof t == 'function')) {
        throw new TypeError(`Type invalid in prop '${key}'!`);
      }

      // Parse default value
      if (defType == 'object') {
        throw new TypeError('Prop defaults must be a primitive value, wrap objects and arrays using a function.');
      } else if (defType == 'function') {
        def = model.default;
      } else {
        def = model.default;
        if (defType == 'undefined' && types.length == 1 && types[0] === Boolean) {
          def = false;
        }
      }

      acc[key] = {
        type: types,
        default: def,
        validator: typeof validator == 'function' ? validator : null,
      };
      return acc;
    }, {});
};

/**
 * Creates a function that can validate props multiple times
 */
module.exports = function createModel(props) {
  const model = parseProps(props);

  return opts => {
    // Check model for every prop
    return Object.keys(model).reduce((acc, key) => {
      const obj = model[key];
      let value = opts[key];

      // Set default value (if available)
      if (typeof value == 'undefined') {
        const type = typeof obj.default;

        if (type != 'undefined') {
          value = type == 'function' ? obj.default() : obj.default;
        }
      }

      validateProp(key, obj, value);
      acc[key] = value;
      return acc;
    }, {});
  };
};
