const fs = require('fs');
const path = require('path');
const jsonschema = require('jsonschema');

const validate = (event) => {
    if (!event.eventName) throw new Error('SchemaRegistry.validate: eventName property is required');
    if (!event.eventVersion) throw new Error('SchemaRegistry.validate: eventVersion property is required');

    const schemaPath = path.join(__dirname, event.eventName, `v${event.eventVersion}.json`)
    if (!fs.existsSync(schemaPath)) throw Error(`Uknown schema ${event.eventName}/v${event.eventVersion}`);

    const schema = require(schemaPath);
    return jsonschema.validate(event, schema, { allowUnknownAttributes: false, });
};

module.exports = {
    validate,
};