// Creates a valid model object from a model
function parseModel(model) {
  const keys = Object.keys(model);

  return keys.forEach(prop => {
    let obj = { type: model[prop] };

    if (typeof obj.type == 'object') {
      const item = obj.type;
      obj = { type: Array.isArray(item) ? item : item.type };

      if (typeof item.validator == 'function') {
        obj.validator = item.validator;
      }
      if ('default' in item) {
        obj.default = item.default;
      }

      obj.required = !!item.required;
    }
    
    // Validate type
    if (Array.isArray(obj.type)) {
      if (!obj.type.every(type => typeof type == 'function')) {
        throw new Error(`Model types are invalid in property '${prop}'!`);
      }
    } else if (typeof obj.type != 'function') {
      throw new Error(`Model type is invalid in property '${prop}'!`);
    }

    model[prop] = obj;
  });
}

// Gets all default values from a model object
function getDefaults(model) {
  const keys = Object.keys(model);

  return keys.filter(prop => {
    let isIn = 'default' in model[prop];
    return isIn;
  }).reduce((acc, prop) => {
    let def = model[prop].default;

    // Run default value if it's a function
    if (typeof def == 'function') {
      def = def();
    }

    acc[prop] = def;
    return acc;
  }, {});
}

// Verifies object types with a value
function verifyType(obj, value) {
  const checkType = type => Object.getPrototypeOf(value) == type.prototype;

  if (Array.isArray(obj.type)) {
    return obj.type.some(checkType);
  }
  return checkType(obj.type);
}

/*
Example model:
{
  foo: String,
  bar: {
    type: Number,
    validator: value => value > 0,
  },
  baz: {
    type: Array,
    // Objects & arrays needs function to instansiate the default value
    default: () => [ '1' ]
  }
}
*/

module.exports = function createModel(model) {
  parseModel(model);
  const defaults = getDefaults(model);

  return function(opts) {
    // Check model for every prop
    return Object.keys(model).reduce((acc, key) => {
      const obj = model[key];
      const value = opts[key];

      if (typeof value != 'undefined') {
        // Type checking
        if (!verifyType(obj, value)) {
          throw new Error(`Type error in model. In property: '${key}'.`);
        }
        // Custom validator check
        if (typeof obj.validator == 'function' && !obj.validator(value)) {
          throw new Error(`Custom validator error in model in property '${key}'`);
        }

        acc[key] = value;
      }  else if (key in defaults) {
        // Set default value
        acc[key] = defaults[key];
      } else if (obj.required) {
        // No value and required
        throw new Error(`Value is required for '${key}'.`);
      }
      return acc;
    }, {});
  };
};
